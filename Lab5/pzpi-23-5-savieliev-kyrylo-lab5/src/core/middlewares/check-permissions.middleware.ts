import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { PermissionsRecord } from '../types/permissions.js'
import { InternalServerError, PermissionsError } from '../utils/errors.js'
import { APIError } from 'better-auth'

export const checkPermissions = (permissions: Partial<PermissionsRecord>) => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const { auth, logger } = request.diScope.cradle
		const permissionsError = new PermissionsError()

		try {
			const hasPermissions = await auth.api.hasPermission({
				headers: fromNodeHeaders(request.headers),
				body: {
					permissions,
				},
			})

			if (!hasPermissions.success) {
				return reply
					.status(permissionsError.code)
					.send(permissionsError.toObject())
			}
		} catch (e: unknown) {
			if (e instanceof APIError) {
				logger.error(`Error while checking permissions: ${e.message}`)

				if (e.body?.code === 'NO_ACTIVE_ORGANIZATION') {
					return reply
						.status(permissionsError.code)
						.send(permissionsError.toObject())
				}
			}

			const internalError = new InternalServerError()

			return reply.status(internalError.code).send(internalError.toObject())
		}
	}
}
