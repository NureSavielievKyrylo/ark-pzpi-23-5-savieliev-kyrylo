import { HexSchema } from '@/core/schemas/common.js'
import {
	buildPaginatedSchema,
	PaginationQuerySchema,
} from '@/core/schemas/pagination.js'
import z from 'zod'

const TagSchema = z.object({
	id: z.uuidv7().describe('Identifier for the tag'),
	createdAt: z.coerce.date().describe('Timestamp when the tag was created'),
	name: z.string().min(3).max(25).describe('Name of the tag'),
	color: HexSchema.describe('Color of the tag in HEX format'),
	organizationId: z.uuidv7().describe('Identifier for the organization'),
})

const GetTagSchema = z.object({
	tagId: z.uuidv7().describe('Identifier for the tag'),
	organizationId: z.uuidv7().describe('Identifier for the organization'),
})

const GetOrganizationTagsParamsSchema = z.object({
	organizationId: z.uuidv7().describe('Identifier for the organization'),
})

type GetOrganizationTagsParams = z.infer<typeof GetOrganizationTagsParamsSchema>

type GetOrganizationTagsQuery = z.infer<typeof PaginationQuerySchema>

const PaginatedTagsSchema = buildPaginatedSchema(TagSchema)

type GetTag = z.infer<typeof GetTagSchema>

const CreateTagShema = TagSchema.omit({ id: true, createdAt: true })

type CreateTag = z.infer<typeof CreateTagShema>

const UpdateTagSchema = CreateTagShema.omit({ organizationId: true }).partial()

type UpdateTag = z.infer<typeof UpdateTagSchema>

export {
	CreateTagShema,
	GetOrganizationTagsParamsSchema,
	GetTagSchema,
	PaginatedTagsSchema,
	TagSchema,
	UpdateTagSchema,
}
export type {
	CreateTag,
	GetTag,
	UpdateTag,
	GetOrganizationTagsParams,
	GetOrganizationTagsQuery,
}
