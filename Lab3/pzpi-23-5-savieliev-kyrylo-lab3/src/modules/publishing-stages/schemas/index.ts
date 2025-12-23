import {
	buildPaginatedSchema,
	PaginationQuerySchema,
} from '@/core/schemas/pagination.js'
import z from 'zod'

const PublishingStageSchema = z.object({
	id: z.uuidv7().describe('Unique identifier of the publishing stage'),
	name: z.string().min(1).max(255).describe('Name of the publishing stage'),
	description: z.string().nullable().describe('Description of the stage'),
	createdAt: z.coerce.date().describe('When the stage started'),
	finishedAt: z.coerce
		.date()
		.nullable()
		.describe('When the stage was completed'),
	deadlineAt: z.coerce
		.date()
		.nullable()
		.describe('Target completion date for the stage'),
	completedBy: z
		.uuidv7()
		.nullable()
		.describe('Member ID who completed the stage'),
	createdBy: z.uuidv7().describe('Member ID who created the stage'),
	manuscriptId: z
		.uuidv7()
		.describe('Manuscript identifier this stage belongs to'),
})

const CompletedByMemberSchema = z.object({
	id: z.uuidv7().describe('Member identifier'),
	name: z.string().describe('Member name'),
	email: z.string().email().describe('Member email'),
	role: z.string().describe('Member role'),
	image: z.string().nullable().describe('Member profile image'),
})

const PublishingStageWithCompletedBySchema = PublishingStageSchema.extend({
	completedByMember: CompletedByMemberSchema.nullable(),
})

const CreatePublishingStageSchema = z.object({
	name: z
		.string()
		.min(1, 'Stage name cannot be empty')
		.max(255, 'Stage name cannot exceed 255 characters')
		.describe('Name of the publishing stage'),
	description: z
		.string()
		.optional()
		.describe('Optional description of the stage'),
	deadlineAt: z.iso
		.datetime()
		.optional()
		.describe('Optional deadline for the stage'),
	completedBy: z
		.uuidv7()
		.optional()
		.describe('Member ID who completed the stage'),
})

const UpdatePublishingStageSchema =
	CreatePublishingStageSchema.partial().extend({
		finishedAt: z.iso
			.datetime()
			.optional()
			.describe('Optional timestamp when the stage was completed'),
	})

const GetPublishingStageParamsSchema = z.object({
	id: z.uuidv7().describe('Publishing stage identifier'),
})

const PaginatedPublishingStagesSchema = buildPaginatedSchema(
	PublishingStageSchema,
)

type CreatePublishingStage = z.infer<typeof CreatePublishingStageSchema>
type UpdatePublishingStage = z.infer<typeof UpdatePublishingStageSchema> & {
	completedBy?: string
}
type GetPublishingStageParams = z.infer<typeof GetPublishingStageParamsSchema>
type GetManuscriptPublishingStagesQuery = z.infer<typeof PaginationQuerySchema>

export {
	CompletedByMemberSchema,
	CreatePublishingStageSchema,
	GetPublishingStageParamsSchema,
	PaginatedPublishingStagesSchema,
	PublishingStageSchema,
	PublishingStageWithCompletedBySchema,
	UpdatePublishingStageSchema,
}

export type {
	CreatePublishingStage,
	GetManuscriptPublishingStagesQuery,
	GetPublishingStageParams,
	UpdatePublishingStage,
}
