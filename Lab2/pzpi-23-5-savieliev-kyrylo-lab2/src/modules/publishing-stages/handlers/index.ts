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

export const getManuscriptPublishingStages = async (
	request: FastifyRequest<{
		Params: GetManuscript
		Querystring: PaginationQuery
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { cursor, limit = 20 } = request.query
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
	const { publishingStagesRepository, manuscriptsRepository, auth, logger } =
		request.diScope.cradle

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

		return reply.status(error.code).send(error.toObject())
	}

	const result = await publishingStagesRepository.createOne({
		...request.body,
		manuscriptId: id,
		createdBy: activeMember.id,
	})

	if (result.isErr()) {
		logger.error(`Failed to create publishing stage: ${result.error.message}`)
		return reply.status(result.error.code).send(result.error.toObject())
	}

	logger.info(
		`Publishing stage created on manuscript ${id} by member ${activeMember.id}`,
	)

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
	const { publishingStagesRepository, auth, logger } = request.diScope.cradle

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

	if (finishedAt) {
		const stageOption = await publishingStagesRepository.findById(id)
		const stage = stageOption.unwrap()

		if (!stage.finishedAt) {
			updateData.completedBy = activeMember.id
		}
	}

	const result = await publishingStagesRepository.updateById(id, updateData)

	if (result.isErr()) {
		logger.error(`Failed to update publishing stage ${id}`)

		return reply.status(result.error.code).send(result.error.toObject())
	}

	logger.info(`Publishing stage ${id} updated`)

	return reply.status(204).send()
}

export const deletePublishingStage = async (
	request: FastifyRequest<{ Params: GetPublishingStageParams }>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { publishingStagesRepository, logger } = request.diScope.cradle

	await publishingStagesRepository.deleteById(id)

	logger.info(`Publishing stage ${id} deleted`)

	return reply.status(204).send()
}
