import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { PermissionsError, UnauthorizedError } from '@/core/utils/errors.js'
import { PublishingStageNotFoundError } from '../errors/index.js'
import type { Permission } from '@/core/types/permissions.js'

type PublishingStagePermission = Exclude<Permission, 'create' | 'read'>

export const checkPublishingStagePermissions = (
	permission: PublishingStagePermission,
) => {
	return async (
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) => {
		const { id: stageId } = request.params
		const { auth, publishingStagesRepository, logger } = request.diScope.cradle

		const activeMember = await auth.api.getActiveMember({
			headers: fromNodeHeaders(request.headers),
		})

		if (!activeMember) {
			const error = new UnauthorizedError()

			return reply.status(error.code).send(error.toObject())
		}

		const exists = await publishingStagesRepository.existsById(stageId)

		if (!exists) {
			const error = new PublishingStageNotFoundError(stageId)

			return reply.status(error.code).send(error.toObject())
		}

		const isInOrg = await publishingStagesRepository.isStageInOrganization({
			stageId,
			organizationId: activeMember.organizationId,
		})

		if (!isInOrg) {
			const error = new PermissionsError()

			return reply.status(error.code).send(error.toObject())
		}

		const isCreator = await publishingStagesRepository.isStageCreator({
			stageId,
			memberId: activeMember.id,
		})

		if (permission === 'update') {
			if (!isCreator) {
				const error = new PermissionsError()

				logger.warn(
					`Member ${activeMember.id} attempted to update publishing stage ${stageId} without ownership`,
				)

				return reply.status(error.code).send(error.toObject())
			}
		} else if (permission === 'delete') {
			const isAdmin =
				activeMember.role === 'admin' || activeMember.role === 'owner'

			if (!isCreator && !isAdmin) {
				const error = new PermissionsError()

				logger.warn(
					`Member ${activeMember.id} attempted to delete publishing stage ${stageId} without permissions`,
				)

				return reply.status(error.code).send(error.toObject())
			}
		}
	}
}
