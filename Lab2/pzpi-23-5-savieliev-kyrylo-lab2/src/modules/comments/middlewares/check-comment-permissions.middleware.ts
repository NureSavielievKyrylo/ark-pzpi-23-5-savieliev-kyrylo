import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { PermissionsError, UnauthorizedError } from '@/core/utils/errors.js'
import { CommentNotFoundError } from '../errors/index.js'
import type { Permission } from '@/core/types/permissions.js'

type CommentPermission = Exclude<Permission, 'create' | 'read'>

export const checkCommentPermissions = (permission: CommentPermission) => {
	return async (
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) => {
		const { id: commentId } = request.params
		const { auth, commentsRepository, logger } = request.diScope.cradle

		const activeMember = await auth.api.getActiveMember({
			headers: fromNodeHeaders(request.headers),
		})

		if (!activeMember) {
			const error = new UnauthorizedError()

			return reply.status(error.code).send(error.toObject())
		}

		const exists = await commentsRepository.existsById(commentId)

		if (!exists) {
			const error = new CommentNotFoundError(commentId)

			return reply.status(error.code).send(error.toObject())
		}

		const isInOrg = await commentsRepository.isCommentInOrganization({
			commentId,
			organizationId: activeMember.organizationId,
		})

		if (!isInOrg) {
			const error = new PermissionsError()

			return reply.status(error.code).send(error.toObject())
		}

		const isAuthor = await commentsRepository.isCommentAuthor({
			commentId,
			memberId: activeMember.id,
		})

		if (permission === 'update') {
			if (!isAuthor) {
				const error = new PermissionsError()

				logger.warn(
					`Member ${activeMember.id} attempted to update comment ${commentId} without ownership`,
				)

				return reply.status(error.code).send(error.toObject())
			}
		} else if (permission === 'delete') {
			const isAdmin =
				activeMember.role === 'admin' || activeMember.role === 'owner'

			if (!isAuthor && !isAdmin) {
				const error = new PermissionsError()

				logger.warn(
					`Member ${activeMember.id} attempted to delete comment ${commentId} without permissions`,
				)

				return reply.status(error.code).send(error.toObject())
			}
		}
	}
}
