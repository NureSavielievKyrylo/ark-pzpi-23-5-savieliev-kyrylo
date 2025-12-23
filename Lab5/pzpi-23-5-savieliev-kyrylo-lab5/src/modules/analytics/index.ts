import { asClass } from 'awilix'
import type { AnalyticsDiConfig } from './types/index.js'
import { AnalyticsServiceImpl } from './services/analytics.service.js'
import { AnalyticsRepository } from './repositories/analytics.repository.js'

export const resolveAnalyticsModule = (): AnalyticsDiConfig => ({
	analyticsService: asClass(AnalyticsServiceImpl).singleton(),
	analyticsRepository: asClass(AnalyticsRepository).singleton(),
})
