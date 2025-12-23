import { asClass } from 'awilix'
import type { ManuscriptsDiConfig } from './types/index.js'
import { ManuscriptsRepositoryImpl } from './repositories/manuscripts.repository.js'
import { FileUploadServiceImpl } from './services/file-upload.service.js'

export const resolveManuscriptsModule = (): ManuscriptsDiConfig => ({
	manuscriptsRepository: asClass(ManuscriptsRepositoryImpl).singleton(),
	fileUploadService: asClass(FileUploadServiceImpl).singleton(),
})
