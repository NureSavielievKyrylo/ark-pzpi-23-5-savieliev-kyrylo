import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '../utils/errors.js'

export const isAuthorized = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const { auth, logger } = request.diScope.cradle

	const session = await auth.api.getSession({
		headers: fromNodeHeaders(request.headers),
	})

	if (!session) {
		const error = new UnauthorizedError()

		logger.warn(`Unauthorized access attempt to ${request.url}`)

		return reply.status(error.code).send(error.toObject())
	}

	request.userId = session.session.userId
}
