import { createFileSchema } from '@/core/schemas/file.js'
import type { FastifyReply, FastifyRequest } from 'fastify'

export const validateFile = ({
	allowedMimeTypes,
}: {
	allowedMimeTypes: string[]
}) => {
	return async (
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> => {
		const file = await request.file()

		const documentSchema = createFileSchema({
			allowedMimeTypes,
		})

		const result = documentSchema.safeParse(file)

		if (!result.success) {
			return reply.status(400).send({
				status: 400,
				error: 'Request Validation Error',
				message: 'Uploaded file is invalid',
				details: {
					issues: result.error.issues,
					method: request.method,
					url: request.url,
				},
			})
		}
	}
}
