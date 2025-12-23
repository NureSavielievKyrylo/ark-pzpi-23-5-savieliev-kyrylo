import { asClass } from 'awilix'
import type { AdminDiConfig } from './types/index.js'
import { BackupServiceImpl } from './services/backup.service.js'
import { BackupRepository } from './repositories/backup.repository.js'

export const resolveAdminModule = (): AdminDiConfig => ({
	backupService: asClass(BackupServiceImpl).singleton(),
	backupRepository: asClass(BackupRepository).singleton(),
})
