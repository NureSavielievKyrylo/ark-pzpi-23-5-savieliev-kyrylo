import type { PaginationQuery } from '@/core/schemas/pagination.js'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { OrganizationNotFoundError } from '../errors/index.js'
import type { GetOrganization } from '../schemas/index.js'

export const getOrganizationManuscripts = async (
	request: FastifyRequest<{
		Params: GetOrganization
		Querystring: PaginationQuery
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { cursor, limit } = request.query
	const { manuscriptsRepository, organizationsRepository, logger } =
		request.diScope.cradle

	const exists = await organizationsRepository.existsById(id)

	if (!exists) {
		const error = new OrganizationNotFoundError(id)

		logger.warn(error.message)

		return reply.status(404).send(error.toObject())
	}

	const manuscripts = await manuscriptsRepository.findByOrganizationPaginated({
		organizationId: id,
		pagination: { cursor, limit },
	})

	return reply.status(200).send(manuscripts)
}

export const getOrganizationTags = async (
	request: FastifyRequest<{
		Params: GetOrganization
		Querystring: PaginationQuery
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { cursor, limit } = request.query
	const { tagsRepository, organizationsRepository, logger } =
		request.diScope.cradle

	const organizationExists = await organizationsRepository.existsById(id)

	if (!organizationExists) {
		const error = new OrganizationNotFoundError(id)

		logger.warn(error.message)

		return reply.status(404).send(error.toObject())
	}

	const tags = await tagsRepository.findByOrganizationPaginated({
		organizationId: id,
		pagination: { cursor, limit },
	})

	return reply.status(200).send(tags)
}
