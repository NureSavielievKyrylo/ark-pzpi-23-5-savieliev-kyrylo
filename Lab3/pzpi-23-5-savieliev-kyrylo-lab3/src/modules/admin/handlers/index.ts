import type { FastifyReply, FastifyRequest } from 'fastify'
import { ENTITY } from '@/core/constants/entities.js'
import { LOG_SEVERITY } from '@/modules/activity-log/constants/index.js'

export const createBackup = async (
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> => {
	const { backupService, logger, activityLog } = request.diScope.cradle

	logger.info('Backup request initiated by admin')

	const result = await backupService.createBackup()

	if (result.isErr()) {
		logger.error(`Backup failed: ${result.error.message}`)

		await activityLog.logInsert({
			entity: ENTITY.BACKUP,
			severity: LOG_SEVERITY.ERROR,
			description: `Database backup failed: ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	await activityLog.logInsert({
		entity: ENTITY.BACKUP,
		severity: LOG_SEVERITY.INFO,
		description: `Database backup created successfully: ${result.value.fileName}`,
		performedBy: request.userId as string,
	})

	logger.info(`Backup created successfully: ${result.value.fileName}`)

	return reply.status(201).send(result.value)
}

export const listBackups = async (
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> => {
	const { backupService } = request.diScope.cradle

	const backups = await backupService.listBackups()

	return reply.status(200).send(backups)
}

export const restoreBackup = async (
	request: FastifyRequest<{ Params: { fileName: string } }>,
	reply: FastifyReply,
): Promise<void> => {
	const { backupService, logger, activityLog } = request.diScope.cradle
	const { fileName } = request.params

	logger.info(`Restore request initiated by admin for: ${fileName}`)

	const result = await backupService.restoreBackup(fileName)

	if (result.isErr()) {
		logger.error(`Restore failed: ${result.error.message}`)

		await activityLog.logUpdate({
			entity: ENTITY.BACKUP,
			severity: LOG_SEVERITY.ERROR,
			description: `Database restore failed from ${fileName}: ${result.error.message}`,
			performedBy: request.userId as string,
		})

		return reply.status(result.error.code).send(result.error.toObject())
	}

	await activityLog.logUpdate({
		entity: ENTITY.BACKUP,
		severity: LOG_SEVERITY.INFO,
		description: `Database restored successfully from: ${fileName}`,
		performedBy: request.userId as string,
	})

	logger.info(`Database restored successfully from: ${fileName}`)

	return reply.status(200).send({ message: 'Database restored successfully' })
}
