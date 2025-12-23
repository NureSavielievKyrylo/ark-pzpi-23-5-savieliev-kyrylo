import type { PaginationQuery } from '@/core/schemas/pagination.js'
import { UnauthorizedError } from '@/core/utils/errors.js'
import { ManuscriptNotFoundError } from '@/modules/manuscripts/errors/index.js'
import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { PublishingStageNotFoundError } from '../errors/index.js'
import type {
	CreatePublishingStage,
	GetPublishingStageParams,
	UpdatePublishingStage,
} from '../schemas/index.js'
import type { GetManuscript } from '@/modules/manuscripts/schemas/index.js'
import { ENTITY } from '@/core/constants/entities.js'
import { LOG_SEVERITY } from '@/modules/activity-log/constants/index.js'

export const getManuscriptPublishingStages = async (
	request: FastifyRequest<{
		Params: GetManuscript
		Querystring: PaginationQuery
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { cursor, limit } = request.query
	const { publishingStagesRepository, manuscriptsRepository, logger } =
		request.diScope.cradle

	const manuscriptExists = await manuscriptsRepository.existsById(id)
	if (!manuscriptExists) {
		const error = new ManuscriptNotFoundError(id)

		logger.warn(error.message)

		return reply.status(error.code).send(error.toObject())
	}

	const paginatedStages =
		await publishingStagesRepository.findByManuscriptPaginated({
			manuscriptId: id,
			pagination: { cursor, limit },
		})

	return reply.status(200).send(paginatedStages)
}

export const getPublishingStage = async (
	request: FastifyRequest<{ Params: GetPublishingStageParams }>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { publishingStagesRepository, logger } = request.diScope.cradle

	const stageOption = await publishingStagesRepository.findById(id)

	const result = stageOption.toResult(new PublishingStageNotFoundError(id))

	if (result.isErr()) {
		logger.warn(result.error.message)

		return reply.status(result.error.code).send(result.error.toObject())
	}

	return reply.status(200).send(result.value)
}

export const createPublishingStage = async (
	request: FastifyRequest<{
		Params: GetManuscript
		Body: CreatePublishingStage
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const {
		publishingStagesRepository,
		manuscriptsRepository,
		auth,
		logger,
		activityLog,
	} = request.diScope.cradle

	const activeMember = await auth.api.getActiveMember({
		headers: fromNodeHeaders(request.headers),
	})

	if (!activeMember) {
		const error = new UnauthorizedError()

		return reply.status(error.code).send(error.toObject())
	}

	const manuscriptExists = await manuscriptsRepository.existsById(id)

	if (!manuscriptExists) {
		const error = new ManuscriptNotFoundError(id)

		logger.error(error.message)

		await activityLog.logInsert({
			entity: ENTITY.PUBLISHING_STAGE,
			severity: LOG_SEVERITY.ERROR,
			description: `Manuscript '${id}' not found for publishing stage creation`,
			performedBy: request.userId as string,
		})

		return reply.status(error.code).send(error.toObject())
	}

	const result = await publishingStagesRepository.createOne({
		...request.body,
		manuscriptId: id,
		createdBy: activeMember.id,
		completedBy: request.body.completedBy ?? activeMember.id,
	})

	if (result.isErr()) {
		logger.error(`Failed to create publishing stage: ${result.error.message}`)

		await activityLog.logInsert({
			entity: ENTITY.PUBLISHING_STAGE,
			severity: LOG_SEVERITY.ERROR,
			description: `Failed to create publishing stage on manuscript '${id}': ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	logger.info(
		`Publishing stage created on manuscript ${id} by member ${activeMember.id}`,
	)

	await activityLog.logInsert({
		entity: ENTITY.PUBLISHING_STAGE,
		severity: LOG_SEVERITY.INFO,
		description: `Publishing stage created on manuscript '${id}'`,
		performedBy: request.userId as string,
	})

	console.log(result.value)

	return reply.status(201).send(result.value)
}

export const updatePublishingStage = async (
	request: FastifyRequest<{
		Params: GetPublishingStageParams
		Body: UpdatePublishingStage
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { name, description, deadlineAt, finishedAt } = request.body
	const { publishingStagesRepository, auth, logger, activityLog } =
		request.diScope.cradle

	const activeMember = await auth.api.getActiveMember({
		headers: fromNodeHeaders(request.headers),
	})

	if (!activeMember) {
		const error = new UnauthorizedError()

		return reply.status(error.code).send(error.toObject())
	}

	const updateData: UpdatePublishingStage = {
		name,
		description,
		deadlineAt,
		finishedAt,
	}

	const stageOption = await publishingStagesRepository.findById(id)

	if (stageOption.isNone()) {
		const error = new PublishingStageNotFoundError(id)

		logger.error(error.message)

		await activityLog.logUpdate({
			entity: ENTITY.PUBLISHING_STAGE,
			severity: LOG_SEVERITY.ERROR,
			description: `Publishing stage '${id}' not found for update`,
			performedBy: request.userId as string,
		})

		return reply.status(error.code).send(error.toObject())
	}

	if (finishedAt) {
		const stage = stageOption.value

		if (!stage.finishedAt) {
			updateData.completedBy = activeMember.id
		}
	}

	const result = await publishingStagesRepository.updateById(id, updateData)

	if (result.isErr()) {
		logger.error(`Failed to update publishing stage ${id}`)

		await activityLog.logUpdate({
			entity: ENTITY.PUBLISHING_STAGE,
			severity: LOG_SEVERITY.ERROR,
			description: `Failed to update publishing stage ${id}: ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	logger.info(`Publishing stage ${id} updated`)

	await activityLog.logUpdate({
		entity: ENTITY.PUBLISHING_STAGE,
		severity: LOG_SEVERITY.INFO,
		description: `Publishing stage '${id}' updated successfully`,
		performedBy: request.userId as string,
	})

	return reply.status(204).send()
}

export const deletePublishingStage = async (
	request: FastifyRequest<{ Params: GetPublishingStageParams }>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { publishingStagesRepository, logger, activityLog } =
		request.diScope.cradle

	const exists = await publishingStagesRepository.existsById(id)

	if (!exists) {
		const error = new PublishingStageNotFoundError(id)

		logger.error(`Publishing stage with id '${id}' not found`)

		await activityLog.logDelete({
			entity: ENTITY.PUBLISHING_STAGE,
			severity: LOG_SEVERITY.ERROR,
			description: `Publishing stage '${id}' not found for deletion`,
			performedBy: request.userId as string,
		})

		return reply.status(error.code).send(error.toObject())
	}

	await publishingStagesRepository.deleteById(id)

	logger.info(`Publishing stage ${id} deleted`)

	await activityLog.logDelete({
		entity: ENTITY.PUBLISHING_STAGE,
		severity: LOG_SEVERITY.INFO,
		description: `Publishing stage '${id}' deleted successfully`,
		performedBy: request.userId as string,
	})

	return reply.status(204).send()
}
