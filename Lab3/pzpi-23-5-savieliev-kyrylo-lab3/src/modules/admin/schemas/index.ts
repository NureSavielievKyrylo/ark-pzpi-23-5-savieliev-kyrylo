import z from 'zod'

export const BackupMetadataSchema = z.object({
	id: z.string().uuid().describe('Unique identifier of the backup'),
	createdAt: z.date().describe('ISO timestamp when backup was created'),
	fileName: z.string().describe('Name of the backup file'),
	sizeInBytes: z.number().describe('Size of the backup file in bytes'),
	url: z.string().url().describe('S3 URL where backup is stored'),
})

export type BackupMetadataResponse = z.infer<typeof BackupMetadataSchema>

export const BackupListSchema = z.array(BackupMetadataSchema)

export const RestoreParamsSchema = z.object({
	fileName: z.string().describe('Name of the backup file to restore'),
})

export const RestoreSuccessSchema = z.object({
	message: z.string().describe('Success message'),
})
