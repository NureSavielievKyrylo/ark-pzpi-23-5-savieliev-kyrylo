import type { MultipartFile } from '@fastify/multipart'
import z from 'zod'

const FileSchema = z.object({
	id: z.uuidv7().describe('File unique identifier'),
	createdAt: z.coerce.date().describe('File creation date'),
	name: z.string().describe('File name'),
	mimeType: z.string().describe('File MIME type'),
	sizeInBytes: z.number().describe('File size in bytes'),
	uploadedBy: z.string().describe('ID of the member who uploaded the file'),
	manuscriptId: z.string().describe('ID of the manuscript the file belongs to'),
})

const createFileSchema = (options: {
	maxSize?: number
	allowedMimeTypes: string[]
}) => {
	let schema = z.custom<MultipartFile>(
		(val) => val && typeof val === 'object' && 'toBuffer' in val,
		{ message: 'Invalid file upload' },
	)

	if (options?.maxSize) {
		const maxSize = options.maxSize

		schema = schema.refine(
			async (file) => {
				const buffer = await file.toBuffer()

				return buffer.length <= maxSize
			},
			{ error: `File size must be less than ${maxSize} bytes` },
		)
	}

	if (options.allowedMimeTypes) {
		const allowedMimeTypes = options.allowedMimeTypes

		schema = schema.refine(
			(file) => {
				return allowedMimeTypes.includes(file.mimetype)
			},
			{ error: `Allowed types: ${options.allowedMimeTypes.join(', ')}` },
		)
	}
	return schema
}

export { createFileSchema, FileSchema }
