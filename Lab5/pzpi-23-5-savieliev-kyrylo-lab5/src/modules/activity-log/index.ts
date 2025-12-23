import { asClass, asFunction } from 'awilix'
import type { ActivityLogDiConfig } from './types/index.js'
import type { CommonDependencies } from '@/core/types/deps.js'
import { createActivityLog } from './utils/index.js'
import { ActivityLogRepository } from './repositories/activity-log.repository.js'

export const resolveActivityLogModule = (): ActivityLogDiConfig => ({
	activityLog: asFunction((deps: CommonDependencies) => {
		return createActivityLog(deps)
	}).singleton(),
	activityLogRepository: asClass(ActivityLogRepository).singleton(),
})
