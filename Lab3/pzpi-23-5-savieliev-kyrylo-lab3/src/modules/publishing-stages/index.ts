import { asClass } from 'awilix'
import type { PublishingStagesDiConfig } from './types/index.js'
import { PublishingStagesRepositoryImpl } from './repositories/publishing-stages.repository.js'

export const resolvePublishingStagesModule = (): PublishingStagesDiConfig => ({
	publishingStagesRepository: asClass(
		PublishingStagesRepositoryImpl,
	).singleton(),
})
