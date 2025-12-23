import { PermissionsError } from '@/core/utils/errors.js'
import { OrganizationNotFoundError } from '@/modules/organizations/errors/index.js'
import type { MultipartFile } from '@fastify/multipart'
import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { FileNotFoundError, ManuscriptNotFoundError } from '../errors/index.js'
import {
	type CreateManuscript,
	type GetFile,
	type GetManuscript,
	type UpdateManuscript,
} from '../schemas/index.js'
import type { GetOrganization } from '@/modules/organizations/schemas/index.js'
import type { PaginationQuery } from '@/core/schemas/pagination.js'
import { ENTITY } from '@/core/constants/entities.js'
import { LOG_SEVERITY } from '@/modules/activity-log/constants/index.js'

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

	const paginatedManuscripts =
		await manuscriptsRepository.findByOrganizationPaginated({
			organizationId: id,
			pagination: { cursor, limit },
		})

	return reply.status(200).send(paginatedManuscripts)
}

export const getManuscript = async (
	request: FastifyRequest<{ Params: GetManuscript }>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { manuscriptsRepository, logger } = request.diScope.cradle

	const manuscript = await manuscriptsRepository.findById(id)

	const result = manuscript.toResult(new ManuscriptNotFoundError(id))

	if (result.isErr()) {
		logger.warn(`Manuscript with id '${id}' not found`)

		return reply.status(result.error.code).send(result.error.toObject())
	}

	return reply.status(200).send(result.value)
}

export const getManuscriptFiles = async (
	request: FastifyRequest<{ Params: GetManuscript }>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { manuscriptsRepository } = request.diScope.cradle

	const exists = await manuscriptsRepository.existsById(id)

	if (!exists) {
		const error = new ManuscriptNotFoundError(id)

		return reply.status(error.code).send(error.toObject())
	}

	const files = await manuscriptsRepository.findFiles(id)

	return reply.status(200).send(files)
}

export const createManuscript = async (
	request: FastifyRequest<{ Body: CreateManuscript }>,
	reply: FastifyReply,
): Promise<void> => {
	const { manuscriptsRepository, logger, activityLog } = request.diScope.cradle

	const result = await manuscriptsRepository.createOne(request.body)

	if (result.isErr()) {
		logger.error(`Failed to create manuscript: ${result.error.message}`)

		await activityLog.logInsert({
			entity: ENTITY.MANUSCRIPT,
			severity: LOG_SEVERITY.ERROR,
			description: `Failed to create manuscript in organization '${request.body.organizationId}': ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	await activityLog.logInsert({
		entity: ENTITY.MANUSCRIPT,
		severity: LOG_SEVERITY.INFO,
		description: `Manuscript created in organization '${request.body.organizationId}'`,
		performedBy: request.userId as string,
	})

	logger.info(
		`New manuscript in organization '${request.body.organizationId}' created`,
	)

	return reply.status(201).send(result.value)
}

export const updateManuscript = async (
	request: FastifyRequest<{
		Params: GetManuscript
		Body: UpdateManuscript
	}>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { manuscriptsRepository, logger, tagsRepository, activityLog } =
		request.diScope.cradle

	const exists = await manuscriptsRepository.existsById(id)

	if (!exists) {
		const error = new ManuscriptNotFoundError(id)

		logger.warn(`Manuscript with id '${id}' not found`)

		await activityLog.logUpdate({
			entity: ENTITY.MANUSCRIPT,
			severity: LOG_SEVERITY.ERROR,
			description: `Manuscript '${id}' not found for update`,
			performedBy: request.userId as string,
		})

		return reply.status(error.code).send(error.toObject())
	}

	const incomingTagIds = request.body.tagIds ?? []

	const { tagsToAdd, tagsToRemove } = await tagsRepository.getTagsDiff(
		id,
		incomingTagIds,
	)

	await manuscriptsRepository.updateById(id, {
		...request.body,
		tagsToAdd,
		tagsToRemove,
	})

	logger.info(`Manuscript with id '${id}' updated`)

	await activityLog.logUpdate({
		entity: ENTITY.MANUSCRIPT,
		severity: LOG_SEVERITY.INFO,
		description: `Manuscript '${id}' successfully updated`,
		performedBy: request.userId as string,
	})

	return reply.status(204).send()
}

export const deleteManuscript = async (
	request: FastifyRequest<{ Params: GetManuscript }>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const { manuscriptsRepository, logger, activityLog } = request.diScope.cradle

	const exists = await manuscriptsRepository.existsById(id)

	if (!exists) {
		const error = new ManuscriptNotFoundError(id)

		logger.warn(`Manuscript with id '${id}' not found`)

		await activityLog.logDelete({
			entity: ENTITY.MANUSCRIPT,
			severity: LOG_SEVERITY.ERROR,
			description: `Manuscript '${id}' not found for deletion`,
			performedBy: request.userId as string,
		})

		return reply.status(error.code).send(error.toObject())
	}

	await manuscriptsRepository.deleteById(id)

	logger.info(`Manuscript with id '${id}' deleted`)

	return reply.status(204).send()
}

export const deleteManuscriptFile = async (
	request: FastifyRequest<{ Params: GetFile }>,
	reply: FastifyReply,
): Promise<void> => {
	const { manuscriptId, fileId } = request.params
	const { fileUploadService, manuscriptsRepository, activityLog } =
		request.diScope.cradle

	const exists = await manuscriptsRepository.existsById(manuscriptId)

	if (!exists) {
		const error = new ManuscriptNotFoundError(manuscriptId)

		await activityLog.logDelete({
			entity: ENTITY.FILE,
			severity: LOG_SEVERITY.ERROR,
			description: `Manuscript '${manuscriptId}' not found for deletion`,
			performedBy: request.userId as string,
		})

		return reply.status(error.code).send(error.toObject())
	}

	const fileOption = await manuscriptsRepository.findFile({
		fileId,
		manuscriptId,
	})

	const fileResult = fileOption.toResult(
		new FileNotFoundError({ fileId, manuscriptId }),
	)

	if (fileResult.isErr()) {
		await activityLog.logDelete({
			entity: ENTITY.FILE,
			severity: LOG_SEVERITY.ERROR,
			description: `File '${fileId}' not found for deletion in manuscript '${manuscriptId}'`,
			performedBy: request.userId as string,
		})

		return reply.status(fileResult.error.code).send(fileResult.error.toObject())
	}

	const deleteResult = await fileUploadService.deleteFile(fileId)

	if (deleteResult.isErr()) {
		await activityLog.logDelete({
			entity: ENTITY.FILE,
			severity: LOG_SEVERITY.ERROR,
			description: `Failed to delete file '${fileId}' in manuscript '${manuscriptId}': ${deleteResult.error.message}`,
			performedBy: request.userId as string,
		})

		return reply
			.status(deleteResult.error.code)
			.send(deleteResult.error.toObject())
	}

	await activityLog.logDelete({
		entity: ENTITY.FILE,
		severity: LOG_SEVERITY.INFO,
		description: `File '${fileId}' deleted successfully from manuscript '${manuscriptId}'`,
		performedBy: request.userId as string,
	})

	return reply.status(204).send()
}

export const updloadManuscriptFile = async (
	request: FastifyRequest<{ Params: GetManuscript }>,
	reply: FastifyReply,
): Promise<void> => {
	const { id } = request.params
	const {
		logger,
		auth,
		fileUploadService,
		activityLog,
		manuscriptsRepository,
	} = request.diScope.cradle

	const activeMember = await auth.api.getActiveMember({
		headers: fromNodeHeaders(request.headers),
	})

	if (!activeMember) {
		const error = new PermissionsError()

		return reply.status(error.code).send(error.toObject())
	}

	const exists = await manuscriptsRepository.existsById(id)

	if (!exists) {
		const error = new ManuscriptNotFoundError(id)

		await activityLog.logUpload({
			entity: ENTITY.FILE,
			severity: LOG_SEVERITY.ERROR,
			description: `Manuscript '${id}' not found for file upload`,
			performedBy: request.userId as string,
		})

		return reply.status(error.code).send(error.toObject())
	}

	const file = (await request.file()) as MultipartFile

	const fileBuffer = await file.toBuffer()

	const result = await fileUploadService.uploadFile({
		fileBuffer: fileBuffer,
		fileName: file.filename || 'untitled',
		uploadedBy: activeMember.id,
		mimeType: file.mimetype,
		manuscriptId: id,
	})

	if (result.isErr()) {
		logger.error(`Failed to upload file for manuscript '${id}'`)

		await activityLog.logUpload({
			entity: ENTITY.FILE,
			severity: LOG_SEVERITY.ERROR,
			description: `Failed to upload file '${file.filename || 'untitled'}' to manuscript '${id}': ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	await activityLog.logUpload({
		entity: ENTITY.FILE,
		severity: LOG_SEVERITY.INFO,
		description: `File '${file.filename || 'untitled'}' uploaded successfully to manuscript '${id}'`,
		performedBy: request.userId as string,
	})

	return reply.status(204).send()
}
