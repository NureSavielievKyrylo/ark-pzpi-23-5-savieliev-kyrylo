import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createGunzip, createGzip } from 'node:zlib'
import { PassThrough } from 'node:stream'
import { Upload } from '@aws-sdk/lib-storage'
import { GetObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import { Err, Ok, type Result } from 'ts-results-es'
import type { HttpError } from '@/core/utils/errors.js'
import type {
	AdminInjectableDependencies,
	BackupService,
} from '../types/index.js'
import {
	BackupDownloadError,
	BackupNotFoundError,
	BackupUploadError,
	PgDumpError,
	PgRestoreError,
} from '../errors/index.js'
import type { FastifyBaseLogger } from 'fastify'
import type { Config } from '@/core/types/config.js'
import type { Backup } from '@/db/types.js'
import type { BackupRepository } from '../types/index.js'

export class BackupServiceImpl implements BackupService {
	private readonly s3: S3Client
	private readonly bucketName: string
	private readonly config: Config
	private readonly logger: FastifyBaseLogger
	private readonly backupRepository: BackupRepository

	constructor({
		s3,
		config,
		logger,
		backupRepository,
	}: AdminInjectableDependencies) {
		this.s3 = s3
		this.bucketName = config.s3.bucket
		this.config = config
		this.logger = logger
		this.backupRepository = backupRepository
	}

	async listBackups(): Promise<Backup[]> {
		return this.backupRepository.findAll()
	}

	async createBackup(): Promise<Result<Backup, HttpError>> {
		const timestamp = Date.now()
		const date = new Date(timestamp).toISOString().split('T')[0]
		const filename = `inkly-backup-${date}-${timestamp}.sql.gz`

		this.logger.info(`Starting database backup: ${filename}`)

		try {
			const { stream, waitForDump } = this.createDumpStream()
			const gzip = createGzip()
			const passThrough = new PassThrough()

			stream.pipe(gzip).pipe(passThrough)

			let compressedSize = 0

			passThrough.on('data', (chunk: Buffer) => {
				compressedSize += chunk.length
			})

			const upload = new Upload({
				client: this.s3,
				params: {
					Bucket: this.bucketName,
					Key: filename,
					Body: passThrough,
					ContentType: 'application/gzip',
					ContentEncoding: 'gzip',
				},
			})

			await Promise.all([upload.done(), waitForDump])

			const s3Url = this.getS3Url(filename)

			const backup = await this.backupRepository.insert({
				fileName: filename,
				sizeInBytes: compressedSize,
				url: s3Url,
			})

			this.logger.info(
				`Backup completed successfully: ${filename} (${compressedSize} bytes)`,
			)

			return Ok(backup)
		} catch (error) {
			this.logger.error(
				`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			)

			if (error instanceof PgDumpError) {
				return Err(error)
			}
			return Err(new BackupUploadError())
		}
	}

	async restoreBackup(fileName: string): Promise<Result<void, HttpError>> {
		this.logger.info(`Starting database restore from: ${fileName}`)

		const backup = await this.backupRepository.findByFileName(fileName)
		if (!backup) {
			return Err(new BackupNotFoundError())
		}

		const tempFile = join(tmpdir(), `restore-${Date.now()}.sql`)

		try {
			const response = await this.s3.send(
				new GetObjectCommand({
					Bucket: this.bucketName,
					Key: fileName,
				}),
			)

			if (!response.Body) {
				return Err(new BackupDownloadError())
			}

			const gunzip = createGunzip()
			const writeStream = createWriteStream(tempFile)

			await pipeline(
				response.Body as NodeJS.ReadableStream,
				gunzip,
				writeStream,
			)

			await this.executePsqlRestore(tempFile)

			this.logger.info(`Database restored successfully from: ${fileName}`)

			return Ok(undefined)
		} catch (error) {
			this.logger.error(
				`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			)

			if (error instanceof PgRestoreError) {
				return Err(error)
			}

			return Err(new BackupDownloadError())
		} finally {
			await unlink(tempFile)
		}
	}

	private createDumpStream(): {
		stream: NodeJS.ReadableStream
		waitForDump: Promise<void>
	} {
		const { user, password, host, port, database } = this.config.db

		const pgDump = spawn(
			'pg_dump',
			[
				'-h',
				host,
				'-p',
				port.toString(),
				'-U',
				user,
				'-d',
				database,
				'--no-password',
				'--format=plain',
			],
			{
				env: {
					...process.env,
					PGPASSWORD: password,
				},
			},
		)

		const waitForDump = new Promise<void>((resolve, reject) => {
			let stderrOutput = ''

			pgDump.stderr.on('data', (data: Buffer) => {
				stderrOutput += data.toString()
			})

			pgDump.on('close', (code) => {
				if (code === 0) {
					resolve()
				} else {
					reject(new PgDumpError(stderrOutput.trim() || `Exit code: ${code}`))
				}
			})

			pgDump.on('error', (err) => {
				reject(new PgDumpError(err.message))
			})
		})

		return {
			stream: pgDump.stdout,
			waitForDump,
		}
	}

	private getS3Url(key: string): string {
		return `https://${this.bucketName}.s3.${this.config.s3.region}.amazonaws.com/${key}`
	}

	private executePsqlRestore(filePath: string): Promise<void> {
		const { user, password, host, port, database } = this.config.db

		return new Promise((resolve, reject) => {
			const psql = spawn(
				'psql',
				[
					'-h',
					host,
					'-p',
					port.toString(),
					'-U',
					user,
					'-d',
					database,
					'-f',
					filePath,
				],
				{
					env: {
						...process.env,
						PGPASSWORD: password,
					},
				},
			)

			let stderrOutput = ''

			psql.stderr.on('data', (data: Buffer) => {
				stderrOutput += data.toString()
			})

			psql.on('close', (code) => {
				if (code === 0) {
					resolve()
				} else {
					reject(
						new PgRestoreError(stderrOutput.trim() || `Exit code: ${code}`),
					)
				}
			})

			psql.on('error', (err) => {
				reject(new PgRestoreError(err.message))
			})
		})
	}
}
