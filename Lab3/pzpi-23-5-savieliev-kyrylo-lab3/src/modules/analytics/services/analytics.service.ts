import type { FastifyBaseLogger } from 'fastify'
import type {
	AnalyticsInjectableDependencies,
	AnalyticsRepository,
	AnalyticsService,
	TransitionMatrix,
	ActivityAnomalyReport,
	DeadlinePrediction,
	MonteCarloReport,
	AnalyticsReport,
	SimulationResult,
} from '../types/index.js'
import {
	mean,
	stdDev,
	zScore,
	pValueFromZScore,
	percentile,
	randomLogNormal,
	steadyStateDistribution,
	expectedHittingTimes,
	betaMean,
	betaConfidenceInterval,
} from '../utils/math.js'

export class AnalyticsServiceImpl implements AnalyticsService {
	private readonly analyticsRepository: AnalyticsRepository
	private readonly logger: FastifyBaseLogger

	constructor({
		analyticsRepository,
		logger,
	}: AnalyticsInjectableDependencies) {
		this.analyticsRepository = analyticsRepository
		this.logger = logger
	}

	async getTransitionMatrix(organizationId: string): Promise<TransitionMatrix> {
		this.logger.info(
			`Computing Markov transition matrix for org: ${organizationId}`,
		)

		const statusHistory =
			await this.analyticsRepository.getManuscriptStatusHistory(organizationId)

		const allStatuses = [...new Set(statusHistory.map((s) => s.status))]

		if (allStatuses.length === 0) {
			return {
				states: [],
				matrix: [],
				steadyState: [],
				expectedHittingTimes: {},
			}
		}

		const n = allStatuses.length
		const transitionCounts: number[][] = Array(n)
			.fill(null)
			.map(() => Array(n).fill(0))

		const manuscriptHistories = new Map<
			string,
			{ status: string; changedAt: Date }[]
		>()
		for (const entry of statusHistory) {
			const existing = manuscriptHistories.get(entry.manuscriptId) ?? []
			existing.push({ status: entry.status, changedAt: entry.changedAt })
			manuscriptHistories.set(entry.manuscriptId, existing)
		}

		for (const [, history] of manuscriptHistories) {
			history.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime())

			for (const historyPart of history) {
				const fromIdx = allStatuses.indexOf(historyPart.status)
				const toIdx = allStatuses.indexOf(historyPart.status)

				if (fromIdx >= 0 && toIdx >= 0) {
					transitionCounts[fromIdx]![toIdx]!++
				}
			}
		}

		const transitionMatrix: number[][] = transitionCounts.map((row) => {
			const rowSum = row.reduce((sum, v) => sum + v, 0)

			if (rowSum === 0) {
				const selfLoop = Array(n).fill(0)

				selfLoop[row.indexOf(Math.max(...row))] = 1

				return selfLoop
			}
			return row.map((v) => v / rowSum)
		})

		for (let i = 0; i < n; i++) {
			const rowSum = transitionMatrix[i]!.reduce((sum, v) => sum + v, 0)

			if (rowSum === 0) {
				transitionMatrix[i]![i] = 1
			}
		}

		const steadyState = steadyStateDistribution(transitionMatrix)

		const targetState = allStatuses.includes('published')
			? allStatuses.indexOf('published')
			: n - 1
		const hittingTimes = expectedHittingTimes(transitionMatrix, targetState)

		const expectedHittingTimesMap: Record<string, number> = {}

		allStatuses.forEach((status, idx) => {
			expectedHittingTimesMap[status] = hittingTimes[idx] ?? 0
		})

		this.logger.info(
			`Markov analysis complete: ${n} states, target state: ${allStatuses[targetState]}`,
		)

		return {
			states: allStatuses,
			matrix: transitionMatrix,
			steadyState,
			expectedHittingTimes: expectedHittingTimesMap,
		}
	}

	async getActivityAnomalies(
		organizationId: string,
		daysBack = 30,
		zThreshold = 2.0,
	): Promise<ActivityAnomalyReport> {
		this.logger.info(
			`Computing activity anomalies for org: ${organizationId}, window: ${daysBack} days`,
		)

		const activityData = await this.analyticsRepository.getActivityCounts(
			organizationId,
			daysBack,
		)

		if (activityData.length === 0) {
			return {
				globalMeanRate: 0,
				globalStdDev: 0,
				anomalyThreshold: zThreshold,
				manuscripts: [],
				anomalies: [],
			}
		}

		const rates = activityData.map((d) => ({
			...d,
			rate: d.activityCount / Math.max(1, d.daysObserved),
		}))

		const allRates = rates.map((r) => r.rate)
		const globalMean = mean(allRates)
		const globalStd = stdDev(allRates)

		const manuscripts = rates.map((r) => {
			const z = zScore(r.rate, globalMean, globalStd)
			const pValue = pValueFromZScore(z)
			return {
				manuscriptId: r.manuscriptId,
				manuscriptName: r.manuscriptName,
				observedRate: r.rate,
				expectedRate: globalMean,
				zScore: z,
				isAnomaly: Math.abs(z) > zThreshold,
				pValue,
			}
		})

		const anomalies = manuscripts.filter((m) => m.isAnomaly)

		this.logger.info(
			`Anomaly detection complete: ${anomalies.length}/${manuscripts.length} anomalies found`,
		)

		return {
			globalMeanRate: globalMean,
			globalStdDev: globalStd,
			anomalyThreshold: zThreshold,
			manuscripts,
			anomalies,
		}
	}

	async getDeadlinePredictions(
		organizationId: string,
	): Promise<DeadlinePrediction[]> {
		this.logger.info(
			`Computing Bayesian deadline predictions for org: ${organizationId}`,
		)

		const manuscripts =
			await this.analyticsRepository.getManuscriptsWithStages(organizationId)
		const historicalDurations =
			await this.analyticsRepository.getHistoricalStageDurations(organizationId)

		const allDurations = historicalDurations.map((d) => d.durationDays)
		const priorMeanDuration = allDurations.length > 0 ? mean(allDurations) : 7

		const predictions: DeadlinePrediction[] = []

		for (const manuscript of manuscripts) {
			const { stages, deadline, commentCount } = manuscript

			const completedStages = stages.filter((s) => s.finishedAt !== null)
			const pendingStages = stages.filter((s) => s.finishedAt === null)

			const stageDurations = completedStages
				.filter((s) => s.finishedAt)
				.map((s) => {
					const duration =
						(s.finishedAt!.getTime() - s.createdAt.getTime()) /
						(1000 * 60 * 60 * 24)
					return Math.max(0.1, duration)
				})

			const priorAlpha = 2
			const priorBeta = 2

			let successCount = 0
			let failureCount = 0

			for (const stage of completedStages) {
				if (stage.deadlineAt && stage.finishedAt) {
					if (stage.finishedAt <= stage.deadlineAt) {
						successCount++
					} else {
						failureCount++
					}
				}
			}

			const posteriorAlpha = priorAlpha + successCount
			const posteriorBeta = priorBeta + failureCount

			const probMeetingDeadline = betaMean(posteriorAlpha, posteriorBeta)

			const avgStageVelocity =
				stageDurations.length > 0 ? mean(stageDurations) : priorMeanDuration

			const expectedRemainingDays = pendingStages.length * avgStageVelocity
			const expectedCompletionDays =
				stageDurations.reduce((sum, d) => sum + d, 0) + expectedRemainingDays

			const ci = betaConfidenceInterval(posteriorAlpha, posteriorBeta)

			let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

			if (deadline) {
				const daysUntilDeadline =
					(deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
				const bufferRatio =
					daysUntilDeadline / Math.max(1, expectedRemainingDays)

				if (bufferRatio < 0.5 || probMeetingDeadline < 0.3) {
					riskLevel = 'critical'
				} else if (bufferRatio < 1.0 || probMeetingDeadline < 0.5) {
					riskLevel = 'high'
				} else if (bufferRatio < 1.5 || probMeetingDeadline < 0.7) {
					riskLevel = 'medium'
				}
			}

			predictions.push({
				manuscriptId: manuscript.manuscriptId,
				manuscriptName: manuscript.manuscriptName,
				deadline,
				probabilityOfMeetingDeadline: probMeetingDeadline,
				expectedCompletionDays,
				confidenceInterval: {
					lower: ci.lower,
					upper: ci.upper,
				},
				riskLevel,
				factors: {
					stagesCompleted: completedStages.length,
					totalStages: stages.length,
					avgStageVelocity,
					commentActivity: commentCount,
				},
			})
		}

		this.logger.info(
			`Deadline predictions complete for ${predictions.length} manuscripts`,
		)

		return predictions
	}

	async getMonteCarloSimulations(
		organizationId: string,
		numSimulations = 10000,
	): Promise<MonteCarloReport> {
		this.logger.info(
			`Running Monte Carlo simulation (${numSimulations} iterations) for org: ${organizationId}`,
		)

		const manuscripts =
			await this.analyticsRepository.getManuscriptsWithStages(organizationId)
		const historicalDurations =
			await this.analyticsRepository.getHistoricalStageDurations(organizationId)

		const stageDistributions: Record<string, { mean: number; stdDev: number }> =
			{}
		const stageGroups = new Map<string, number[]>()

		for (const duration of historicalDurations) {
			const existing = stageGroups.get(duration.stageName) ?? []
			existing.push(duration.durationDays)
			stageGroups.set(duration.stageName, existing)
		}

		for (const [stageName, durations] of stageGroups) {
			stageDistributions[stageName] = {
				mean: mean(durations),
				stdDev: Math.max(0.5, stdDev(durations)),
			}
		}

		const allDurations = historicalDurations.map((d) => d.durationDays)
		const defaultMean = allDurations.length > 0 ? mean(allDurations) : 7
		const defaultStdDev =
			allDurations.length > 0 ? Math.max(0.5, stdDev(allDurations)) : 3

		const simulationResults: SimulationResult[] = []

		for (const manuscript of manuscripts) {
			const { stages } = manuscript

			const remainingStages = stages.filter((s) => s.finishedAt === null)

			if (remainingStages.length === 0) {
				simulationResults.push({
					manuscriptId: manuscript.manuscriptId,
					manuscriptName: manuscript.manuscriptName,
					simulations: 0,
					percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
					meanCompletionDays: 0,
					stdDevDays: 0,
					probabilityByDate: [],
				})
				continue
			}

			const completionTimes: number[] = []

			for (let sim = 0; sim < numSimulations; sim++) {
				let totalDays = 0

				for (let i = 0; i < remainingStages.length; i++) {
					const stageDuration = randomLogNormal(defaultMean, defaultStdDev)
					totalDays += stageDuration
				}

				completionTimes.push(totalDays)
			}

			completionTimes.sort((a, b) => a - b)

			const simMean = mean(completionTimes)
			const simStdDev = stdDev(completionTimes)

			const probabilityByDate: { date: string; probability: number }[] = []
			for (let day = 7; day <= 90; day += 7) {
				const completedCount = completionTimes.filter((t) => t <= day).length

				probabilityByDate.push({
					date: new Date(Date.now() + day * 24 * 60 * 60 * 1000)
						.toISOString()
						.split('T')[0]!,
					probability: completedCount / numSimulations,
				})
			}

			simulationResults.push({
				manuscriptId: manuscript.manuscriptId,
				manuscriptName: manuscript.manuscriptName,
				simulations: numSimulations,
				percentiles: {
					p10: percentile(completionTimes, 10),
					p25: percentile(completionTimes, 25),
					p50: percentile(completionTimes, 50),
					p75: percentile(completionTimes, 75),
					p90: percentile(completionTimes, 90),
					p95: percentile(completionTimes, 95),
				},
				meanCompletionDays: simMean,
				stdDevDays: simStdDev,
				probabilityByDate,
			})
		}

		this.logger.info(
			`Monte Carlo simulation complete for ${simulationResults.length} manuscripts`,
		)

		return {
			manuscripts: simulationResults,
			stageDistributions,
		}
	}

	async getFullReport(organizationId: string): Promise<AnalyticsReport> {
		this.logger.info(
			`Generating full analytics report for org: ${organizationId}`,
		)

		const [
			transitionAnalysis,
			activityAnomalies,
			deadlinePredictions,
			monteCarloSimulations,
		] = await Promise.all([
			this.getTransitionMatrix(organizationId),
			this.getActivityAnomalies(organizationId),
			this.getDeadlinePredictions(organizationId),
			this.getMonteCarloSimulations(organizationId),
		])

		return {
			generatedAt: new Date().toISOString(),
			organizationId,
			transitionAnalysis,
			activityAnomalies,
			deadlinePredictions,
			monteCarloSimulations,
		}
	}
}
