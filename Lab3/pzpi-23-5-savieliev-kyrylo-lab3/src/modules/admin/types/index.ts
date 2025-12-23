import type { BaseDiConfig, InjectableDependencies } from '@/core/types/deps.js'
import type { HttpError } from '@/core/utils/errors.js'
import type { Backup } from '@/db/types.js'
import type { Result } from 'ts-results-es'

interface BackupRepository {
	insert: (data: {
		fileName: string
		sizeInBytes: number
		url: string
	}) => Promise<Backup>
	findAll: () => Promise<Backup[]>
	findByFileName: (fileName: string) => Promise<Backup | undefined>
}

interface BackupService {
	createBackup: () => Promise<Result<Backup, HttpError>>
	listBackups: () => Promise<Backup[]>
	restoreBackup: (fileName: string) => Promise<Result<void, HttpError>>
}

interface AdminModuleDependencies {
	backupService: BackupService
	backupRepository: BackupRepository
}

type AdminInjectableDependencies =
	InjectableDependencies<AdminModuleDependencies>

type AdminDiConfig = BaseDiConfig<AdminModuleDependencies>

export type {
	AdminDiConfig,
	AdminInjectableDependencies,
	AdminModuleDependencies,
	BackupService,
	BackupRepository,
}
