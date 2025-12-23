import type { FastifyReply, FastifyRequest } from 'fastify'
import { TagNotFoundError } from '../errors/index.js'
import type { CreateTag, GetTag, UpdateTag } from '../schemas/index.js'
import { ENTITY } from '@/core/constants/entities.js'
import { LOG_SEVERITY } from '@/modules/activity-log/constants/index.js'

export const createTag = async (
	request: FastifyRequest<{ Body: CreateTag }>,
	reply: FastifyReply,
): Promise<void> => {
	const { tagsRepository, logger, activityLog } = request.diScope.cradle

	const result = await tagsRepository.createOne(request.body)

	if (result.isErr()) {
		logger.error(`Error creating tag: ${result.error.message}`)

		await activityLog.logInsert({
			entity: ENTITY.TAG,
			severity: LOG_SEVERITY.ERROR,
			description: `Error creating tag in organization '${request.body.organizationId}': ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	logger.info(
		`New tag in organization '${request.body.organizationId}' created`,
	)

	await activityLog.logInsert({
		entity: ENTITY.TAG,
		severity: LOG_SEVERITY.INFO,
		description: `Tag in organization '${request.body.organizationId}' created`,
		performedBy: request.userId as string,
	})

	return reply.status(201).send(result.value)
}

export const updateTag = async (
	request: FastifyRequest<{ Params: GetTag; Body: UpdateTag }>,
	reply: FastifyReply,
): Promise<void> => {
	const { tagId, organizationId } = request.params
	const { tagsRepository, logger, activityLog } = request.diScope.cradle

	const exists = await tagsRepository.existsInOrganization({
		tagId,
		organizationId,
	})

	if (!exists) {
		const error = new TagNotFoundError(tagId)

		logger.warn(error.message)

		await activityLog.logUpdate({
			entity: ENTITY.TAG,
			severity: LOG_SEVERITY.ERROR,
			description: `Tag '${tagId}' not found for update`,
			performedBy: request.userId as string,
		})

		return reply.status(error.code).send(error.toObject())
	}

	const result = await tagsRepository.updateById(tagId, request.body)

	if (result.isErr()) {
		logger.error(`Error updating tag: ${result.error.message}`)

		await activityLog.logUpdate({
			entity: ENTITY.TAG,
			severity: LOG_SEVERITY.ERROR,
			description: `Error updating tag '${tagId}': ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	await activityLog.logUpdate({
		entity: ENTITY.TAG,
		severity: LOG_SEVERITY.INFO,
		description: `Tag '${tagId}' updated`,
		performedBy: request.userId as string,
	})

	return reply.status(204).send()
}

export const deleteTag = async (
	request: FastifyRequest<{ Params: GetTag }>,
	reply: FastifyReply,
): Promise<void> => {
	const { tagId, organizationId } = request.params
	const { tagsRepository, logger, activityLog } = request.diScope.cradle

	const exists = await tagsRepository.existsInOrganization({
		tagId,
		organizationId,
	})

	if (!exists) {
		const error = new TagNotFoundError(tagId)

		await activityLog.logDelete({
			entity: ENTITY.TAG,
			severity: LOG_SEVERITY.ERROR,
			description: `Tag '${tagId}' not found for delete`,
			performedBy: request.userId as string,
		})

		logger.warn(error.message)

		return reply.status(error.code).send(error.toObject())
	}

	await activityLog.logDelete({
		entity: ENTITY.TAG,
		severity: LOG_SEVERITY.INFO,
		description: `Tag '${tagId}' deleted`,
		performedBy: request.userId as string,
	})

	await tagsRepository.deleteById(tagId)

	return reply.status(204).send()
}
