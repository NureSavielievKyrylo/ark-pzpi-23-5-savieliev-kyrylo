import z from 'zod'

export const OrganizationParamsSchema = z.object({
	organizationId: z.string().uuid().describe('Organization ID'),
})

export const TransitionMatrixSchema = z.object({
	states: z.array(z.string()).describe('List of status states'),
	matrix: z
		.array(z.array(z.number()))
		.describe('Transition probability matrix (row = from, col = to)'),
	steadyState: z
		.array(z.number())
		.describe('Steady-state probability distribution'),
	expectedHittingTimes: z
		.record(z.string(), z.number())
		.describe('Expected steps to reach terminal state from each state'),
})

export const AnomalyQuerySchema = z.object({
	daysBack: z.coerce
		.number()
		.int()
		.min(1)
		.max(365)
		.optional()
		.describe('Number of days to analyze (default: 30)'),
	zThreshold: z.coerce
		.number()
		.min(1)
		.max(5)
		.optional()
		.describe('Z-score threshold for anomaly detection (default: 2.0)'),
})

export const ActivityRateSchema = z.object({
	manuscriptId: z.string().uuid(),
	manuscriptName: z.string(),
	observedRate: z.number().describe('Observed activity rate (events/day)'),
	expectedRate: z.number().describe('Expected rate based on global average'),
	zScore: z.number().describe('Standard deviations from mean'),
	isAnomaly: z.boolean(),
	pValue: z.number().describe('Statistical significance'),
})

export const ActivityAnomalyReportSchema = z.object({
	globalMeanRate: z
		.number()
		.describe('Average activity rate across all manuscripts'),
	globalStdDev: z.number().describe('Standard deviation of activity rates'),
	anomalyThreshold: z.number().describe('Z-score threshold used'),
	manuscripts: z.array(ActivityRateSchema),
	anomalies: z
		.array(ActivityRateSchema)
		.describe('Manuscripts with unusual activity'),
})

export const DeadlinePredictionSchema = z.object({
	manuscriptId: z.string().uuid(),
	manuscriptName: z.string(),
	deadline: z.date().nullable(),
	probabilityOfMeetingDeadline: z
		.number()
		.min(0)
		.max(1)
		.describe('Bayesian posterior probability'),
	expectedCompletionDays: z.number().describe('Expected days to completion'),
	confidenceInterval: z.object({
		lower: z.number(),
		upper: z.number(),
	}),
	riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
	factors: z.object({
		stagesCompleted: z.number(),
		totalStages: z.number(),
		avgStageVelocity: z.number().describe('Average days per stage'),
		commentActivity: z.number(),
	}),
})

export const DeadlinePredictionsListSchema = z.array(DeadlinePredictionSchema)

export const SimulationQuerySchema = z.object({
	simulations: z.coerce
		.number()
		.int()
		.min(100)
		.max(100000)
		.optional()
		.describe('Number of Monte Carlo simulations (default: 10000)'),
})

export const SimulationResultSchema = z.object({
	manuscriptId: z.string().uuid(),
	manuscriptName: z.string(),
	simulations: z.number().describe('Number of simulations run'),
	percentiles: z.object({
		p10: z.number().describe('10th percentile completion days'),
		p25: z.number().describe('25th percentile completion days'),
		p50: z.number().describe('Median completion days'),
		p75: z.number().describe('75th percentile completion days'),
		p90: z.number().describe('90th percentile completion days'),
		p95: z.number().describe('95th percentile completion days'),
	}),
	meanCompletionDays: z.number(),
	stdDevDays: z.number(),
	probabilityByDate: z.array(
		z.object({
			date: z.string().describe('ISO date'),
			probability: z.number().describe('Cumulative probability of completion'),
		}),
	),
})

export const MonteCarloReportSchema = z.object({
	manuscripts: z.array(SimulationResultSchema),
	stageDistributions: z
		.record(
			z.string(),
			z.object({
				mean: z.number(),
				stdDev: z.number(),
			}),
		)
		.describe('Historical duration distributions by stage type'),
})

export const AnalyticsReportSchema = z.object({
	generatedAt: z.string().datetime(),
	organizationId: z.string().uuid(),
	transitionAnalysis: TransitionMatrixSchema,
	activityAnomalies: ActivityAnomalyReportSchema,
	deadlinePredictions: z.array(DeadlinePredictionSchema),
	monteCarloSimulations: MonteCarloReportSchema,
})
