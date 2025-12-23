import type { CommonDependencies, DatabaseClient } from '@/core/types/deps.js'
import { backupTable } from '@/db/schema/backup.js'
import type { Backup } from '@/db/types.js'
import { desc, eq } from 'drizzle-orm'

export class BackupRepository {
	private readonly db: DatabaseClient

	constructor({ db }: CommonDependencies) {
		this.db = db.client
	}

	async insert(data: {
		fileName: string
		sizeInBytes: number
		url: string
	}): Promise<Backup> {
		const [backup] = await this.db.insert(backupTable).values(data).returning()

		return backup!
	}

	async findAll(): Promise<Backup[]> {
		return this.db
			.select()
			.from(backupTable)
			.orderBy(desc(backupTable.createdAt))
	}

	async findByFileName(fileName: string): Promise<Backup | undefined> {
		const [backup] = await this.db
			.select()
			.from(backupTable)
			.where(eq(backupTable.fileName, fileName))

		return backup
	}
}
