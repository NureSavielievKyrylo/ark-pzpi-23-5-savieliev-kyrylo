import type { BaseDiConfig, InjectableDependencies } from '@/core/types/deps.js'

// Markov Chain Types
interface StatusTransition {
	fromStatus: string
	toStatus: string
	count: number
	probability: number
}

interface TransitionMatrix {
	states: string[]
	matrix: number[][]
	steadyState: number[]
	expectedHittingTimes: Record<string, number>
}

interface ActivityRate {
	manuscriptId: string
	manuscriptName: string
	observedRate: number
	expectedRate: number
	zScore: number
	isAnomaly: boolean
	pValue: number
}

interface ActivityAnomalyReport {
	globalMeanRate: number
	globalStdDev: number
	anomalyThreshold: number
	manuscripts: ActivityRate[]
	anomalies: ActivityRate[]
}

interface DeadlinePrediction {
	manuscriptId: string
	manuscriptName: string
	deadline: Date | null
	probabilityOfMeetingDeadline: number
	expectedCompletionDays: number
	confidenceInterval: { lower: number; upper: number }
	riskLevel: 'low' | 'medium' | 'high' | 'critical'
	factors: {
		stagesCompleted: number
		totalStages: number
		avgStageVelocity: number
		commentActivity: number
	}
}
interface SimulationResult {
	manuscriptId: string
	manuscriptName: string
	simulations: number
	percentiles: {
		p10: number
		p25: number
		p50: number
		p75: number
		p90: number
		p95: number
	}
	meanCompletionDays: number
	stdDevDays: number
	probabilityByDate: { date: string; probability: number }[]
}

interface MonteCarloReport {
	manuscripts: SimulationResult[]
	stageDistributions: Record<string, { mean: number; stdDev: number }>
}

interface AnalyticsReport {
	generatedAt: string
	organizationId: string
	transitionAnalysis: TransitionMatrix
	activityAnomalies: ActivityAnomalyReport
	deadlinePredictions: DeadlinePrediction[]
	monteCarloSimulations: MonteCarloReport
}

interface AnalyticsRepository {
	getManuscriptStatusHistory: (
		organizationId: string,
	) => Promise<{ manuscriptId: string; status: string; changedAt: Date }[]>
	getActivityCounts: (
		organizationId: string,
		daysBack: number,
	) => Promise<
		{
			manuscriptId: string
			manuscriptName: string
			activityCount: number
			daysObserved: number
		}[]
	>
	getManuscriptsWithStages: (organizationId: string) => Promise<
		{
			manuscriptId: string
			manuscriptName: string
			deadline: Date | null
			status: string
			stages: {
				createdAt: Date
				finishedAt: Date | null
				deadlineAt: Date | null
			}[]
			commentCount: number
		}[]
	>
	getHistoricalStageDurations: (
		organizationId: string,
	) => Promise<{ stageName: string; durationDays: number }[]>
}

interface AnalyticsService {
	getTransitionMatrix: (organizationId: string) => Promise<TransitionMatrix>
	getActivityAnomalies: (
		organizationId: string,
		daysBack?: number,
		zThreshold?: number,
	) => Promise<ActivityAnomalyReport>
	getDeadlinePredictions: (
		organizationId: string,
	) => Promise<DeadlinePrediction[]>
	getMonteCarloSimulations: (
		organizationId: string,
		numSimulations?: number,
	) => Promise<MonteCarloReport>
	getFullReport: (organizationId: string) => Promise<AnalyticsReport>
}

interface AnalyticsModuleDependencies {
	analyticsService: AnalyticsService
	analyticsRepository: AnalyticsRepository
}

type AnalyticsInjectableDependencies =
	InjectableDependencies<AnalyticsModuleDependencies>

type AnalyticsDiConfig = BaseDiConfig<AnalyticsModuleDependencies>

export type {
	AnalyticsDiConfig,
	AnalyticsInjectableDependencies,
	AnalyticsModuleDependencies,
	AnalyticsService,
	AnalyticsRepository,
	StatusTransition,
	TransitionMatrix,
	ActivityRate,
	ActivityAnomalyReport,
	DeadlinePrediction,
	SimulationResult,
	MonteCarloReport,
	AnalyticsReport,
}
