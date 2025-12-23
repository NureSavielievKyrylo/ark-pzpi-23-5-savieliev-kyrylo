import type { FastifyReply, FastifyRequest } from 'fastify'

interface OrgParams {
	organizationId: string
}

interface AnomalyQuery {
	daysBack?: number
	zThreshold?: number
}

interface SimulationQuery {
	simulations?: number
}

export const getTransitionMatrix = async (
	request: FastifyRequest<{ Params: OrgParams }>,
	reply: FastifyReply,
): Promise<void> => {
	const { analyticsService } = request.diScope.cradle
	const { organizationId } = request.params

	const result = await analyticsService.getTransitionMatrix(organizationId)

	return reply.status(200).send(result)
}

export const getActivityAnomalies = async (
	request: FastifyRequest<{ Params: OrgParams; Querystring: AnomalyQuery }>,
	reply: FastifyReply,
): Promise<void> => {
	const { analyticsService } = request.diScope.cradle
	const { organizationId } = request.params
	const { daysBack, zThreshold } = request.query

	const result = await analyticsService.getActivityAnomalies(
		organizationId,
		daysBack,
		zThreshold,
	)

	return reply.status(200).send(result)
}

export const getDeadlinePredictions = async (
	request: FastifyRequest<{ Params: OrgParams }>,
	reply: FastifyReply,
): Promise<void> => {
	const { analyticsService } = request.diScope.cradle
	const { organizationId } = request.params

	const result = await analyticsService.getDeadlinePredictions(organizationId)

	return reply.status(200).send(result)
}

export const getMonteCarloSimulations = async (
	request: FastifyRequest<{ Params: OrgParams; Querystring: SimulationQuery }>,
	reply: FastifyReply,
): Promise<void> => {
	const { analyticsService } = request.diScope.cradle
	const { organizationId } = request.params
	const { simulations } = request.query

	const result = await analyticsService.getMonteCarloSimulations(
		organizationId,
		simulations,
	)

	return reply.status(200).send(result)
}
