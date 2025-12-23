import { isAuthorized } from '@/core/middlewares/is-authorized.middleware.js'
import type { Routes } from '@/core/types/routes.js'
import { generateFailedHttpResponse } from '@/core/utils/schemas.js'
import {
	getActivityAnomalies,
	getDeadlinePredictions,
	getMonteCarloSimulations,
	getTransitionMatrix,
} from '../handlers/index.js'
import {
	ActivityAnomalyReportSchema,
	AnomalyQuerySchema,
	DeadlinePredictionsListSchema,
	MonteCarloReportSchema,
	OrganizationParamsSchema,
	SimulationQuerySchema,
	TransitionMatrixSchema,
} from '../schemas/index.js'

export const getAnalyticsRoutes = (): Routes => ({
	routes: [
		{
			method: 'GET',
			url: '/organizations/:organizationId/analytics/transitions',
			handler: getTransitionMatrix,
			preHandler: [isAuthorized],
			schema: {
				summary: 'Get Markov chain transition matrix',
				description:
					'Get Markov chain transition matrix for manuscript status changes',
				tags: ['Analytics'],
				params: OrganizationParamsSchema,
				response: {
					200: TransitionMatrixSchema.describe(
						'Transition probability matrix with steady-state distribution',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authorized',
					),
				},
			},
		},
		{
			method: 'GET',
			url: '/organizations/:organizationId/analytics/anomalies',
			handler: getActivityAnomalies,
			preHandler: [isAuthorized],
			schema: {
				summary: 'Detect activity anomalies',
				description: 'Detect activity anomalies using Poisson process analysis',
				tags: ['Analytics'],
				params: OrganizationParamsSchema,
				querystring: AnomalyQuerySchema,
				response: {
					200: ActivityAnomalyReportSchema.describe(
						'Activity anomaly detection report',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authorized',
					),
				},
			},
		},
		{
			method: 'GET',
			url: '/organizations/:organizationId/analytics/deadlines',
			handler: getDeadlinePredictions,
			preHandler: [isAuthorized],
			schema: {
				summary: 'Get Bayesian deadline predictions',
				description: 'Get Bayesian deadline predictions for all manuscripts',
				tags: ['Analytics'],
				params: OrganizationParamsSchema,
				response: {
					200: DeadlinePredictionsListSchema.describe(
						'Deadline predictions with probability estimates',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authorized',
					),
				},
			},
		},
		{
			method: 'GET',
			url: '/organizations/:organizationId/analytics/simulations',
			handler: getMonteCarloSimulations,
			preHandler: [isAuthorized],
			schema: {
				summary: 'Monte Carlo simulations for project completion estimates',
				description:
					'Run Monte Carlo simulations for project completion estimates',
				tags: ['Analytics'],
				params: OrganizationParamsSchema,
				querystring: SimulationQuerySchema,
				response: {
					200: MonteCarloReportSchema.describe(
						'Monte Carlo simulation results with percentiles',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authorized',
					),
				},
			},
		},
	],
})
