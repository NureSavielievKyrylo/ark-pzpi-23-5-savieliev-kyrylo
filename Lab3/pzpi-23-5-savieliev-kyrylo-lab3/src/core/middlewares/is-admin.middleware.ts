import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { PermissionsError } from '../utils/errors.js'

export const isAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
	const { auth, logger } = request.diScope.cradle

	const session = await auth.api.getSession({
		headers: fromNodeHeaders(request.headers),
	})

	console.log(session)

	if (session?.user.role !== 'admin') {
		const error = new PermissionsError()

		logger.warn(
			`Unauthorized admin access attempt by user ID: ${session?.user.id ?? 'unknown'}`,
		)

		return reply.status(error.code).send(error.toObject())
	}
}
