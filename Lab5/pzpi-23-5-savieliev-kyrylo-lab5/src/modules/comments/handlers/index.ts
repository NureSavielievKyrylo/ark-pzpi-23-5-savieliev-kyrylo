import type { PaginationQuery } from '@/core/schemas/pagination.js'
import { UnauthorizedError } from '@/core/utils/errors.js'
import { ManuscriptNotFoundError } from '@/modules/manuscripts/errors/index.js'
import type { GetManuscript } from '@/modules/manuscripts/schemas/index.js'
import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import {
	CommentNotFoundError,
	ParentCommentNotFoundError,
} from '../errors/index.js'
import type {
	CreateComment,
	CreateReplyParams,
	GetCommentParams,
	UpdateComment,
} from '../schemas/index.js'
import { ENTITY } from '@/core/constants/entities.js'
import { LOG_SEVERITY } from '@/modules/activity-log/constants/index.js'

export const getManuscriptComments = async (
	request: FastifyRequest<{
		Params: GetManuscript
		Querystring: PaginationQuery
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { cursor, limit } = request.query
	const { commentsRepository, manuscriptsRepository, logger } =
		request.diScope.cradle

	const manuscriptExists = await manuscriptsRepository.existsById(id)
	if (!manuscriptExists) {
		const error = new ManuscriptNotFoundError(id)

		logger.warn(error.message)

		return reply.status(error.code).send(error.toObject())
	}

	const paginatedComments = await commentsRepository.findByManuscript({
		manuscriptId: id,
		pagination: { cursor, limit },
	})

	return reply.status(200).send(paginatedComments)
}

export const getComment = async (
	request: FastifyRequest<{ Params: GetCommentParams }>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { commentsRepository, logger } = request.diScope.cradle

	const commentOption = await commentsRepository.findByIdWithAuthor(id)

	const result = commentOption.toResult(new CommentNotFoundError(id))

	if (result.isErr()) {
		logger.warn(result.error.message)

		return reply.status(result.error.code).send(result.error.toObject())
	}

	return reply.status(200).send(result.value)
}

export const createComment = async (
	request: FastifyRequest<{
		Params: GetManuscript
		Body: CreateComment
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { text } = request.body
	const {
		commentsRepository,
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

		return reply.status(error.code).send(error.toObject())
	}

	const result = await commentsRepository.createOne({
		text,
		manuscriptId: id,
		authorId: activeMember.id,
		parentId: null,
	})

	if (result.isErr()) {
		logger.error(`Failed to create comment: ${result.error.message}`)

		await activityLog.logInsert({
			entity: ENTITY.COMMENT,
			severity: LOG_SEVERITY.ERROR,
			description: `Failed to create a comment by member ${activeMember.id}: ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	logger.info(
		`Comment created on manuscript ${id} by member ${activeMember.id}`,
	)

	await activityLog.logInsert({
		entity: ENTITY.COMMENT,
		severity: LOG_SEVERITY.INFO,
		description: `Comment created on manuscript ${id} by member ${activeMember.id}`,
		performedBy: request.userId as string,
	})

	return reply.status(201).send(result.value)
}

export const createReply = async (
	request: FastifyRequest<{
		Params: CreateReplyParams
		Body: CreateComment
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { manuscriptId, commentId } = request.params
	const { text } = request.body
	const {
		commentsRepository,
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

	const manuscriptExists = await manuscriptsRepository.existsById(manuscriptId)

	if (!manuscriptExists) {
		const error = new ManuscriptNotFoundError(manuscriptId)

		return reply.status(error.code).send(error.toObject())
	}

	const parentExists = await commentsRepository.existsById(commentId)

	if (!parentExists) {
		const error = new ParentCommentNotFoundError(commentId)

		return reply.status(error.code).send(error.toObject())
	}

	const result = await commentsRepository.createOne({
		text,
		manuscriptId,
		authorId: activeMember.id,
		parentId: commentId,
	})

	if (result.isErr()) {
		logger.error(`Failed to create reply: ${result.error.message}`)

		await activityLog.logInsert({
			entity: ENTITY.COMMENT,
			severity: LOG_SEVERITY.ERROR,
			description: `Failed to create reply on comment ${commentId} by member ${activeMember.id}: ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	await activityLog.logInsert({
		entity: ENTITY.COMMENT,
		severity: LOG_SEVERITY.INFO,
		description: `Reply created on comment ${commentId} by member ${activeMember.id}`,
		performedBy: request.userId as string,
	})

	logger.info(
		`Reply created on comment ${commentId} by member ${activeMember.id}`,
	)

	return reply.status(201).send(result.value)
}

export const updateComment = async (
	request: FastifyRequest<{
		Params: GetCommentParams
		Body: UpdateComment
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params

	const { commentsRepository, logger, activityLog } = request.diScope.cradle

	const result = await commentsRepository.updateById(id, request.body)

	if (result.isErr()) {
		logger.error(`Failed to update comment ${id}`)

		await activityLog.logUpdate({
			entity: ENTITY.COMMENT,
			severity: LOG_SEVERITY.ERROR,
			description: `Failed to update comment ${id}: ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	logger.info(`Comment ${id} updated`)

	await activityLog.logUpdate({
		entity: ENTITY.COMMENT,
		severity: LOG_SEVERITY.INFO,
		description: `Comment ${id} updated successfully`,
		performedBy: request.userId as string,
	})

	return reply.status(204).send()
}

export const deleteComment = async (
	request: FastifyRequest<{ Params: GetCommentParams }>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { commentsRepository, logger, activityLog } = request.diScope.cradle

	await commentsRepository.deleteById(id)

	logger.info(`Comment ${id} deleted`)

	await activityLog.logDelete({
		entity: ENTITY.COMMENT,
		severity: LOG_SEVERITY.INFO,
		description: `Comment ${id} deleted successfully`,
		performedBy: request.userId as string,
	})

	return reply.status(204).send()
}
