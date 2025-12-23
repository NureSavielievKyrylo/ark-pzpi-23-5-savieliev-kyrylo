import z from 'zod'
import { MANUSCRIPT_STATUS, PUBLICATION_TYPE } from '../constants/index.js'

const ManuscriptModelSchema = z.strictObject({
	id: z.uuidv7().describe('Unique identifier of the manuscript'),
	createdAt: z.coerce.date().describe('Creation timestamp of the manuscript'),
	updatedAt: z.coerce
		.date()
		.describe('Last update timestamp of the manuscript'),
	deadlineAt: z.coerce.date().describe('Deadline of the manuscript'),
	name: z.string().min(5).max(100).describe('Name of the manuscript'),
	description: z
		.string()
		.nullable()
		.default(null)
		.describe('Description of the manuscript'),
	status: z
		.enum(Object.values(MANUSCRIPT_STATUS))
		.describe('Status of the manuscript'),
	publicationType: z
		.enum(Object.values(PUBLICATION_TYPE))
		.describe('Publication type of the manuscript'),
	language: z
		.string()
		.min(2)
		.max(5)
		.describe('Language code of the manuscript'),
	organizationId: z
		.uuidv7()
		.describe('Organization identifier associated with the manuscript'),
})

const GetManuscriptParamsSchema = z.strictObject({
	id: z.uuidv7().describe('Identifier of the manuscript'),
})

const GetFileParamsSchema = z.object({
	manuscriptId: z.uuidv7().describe('Identifier of the manuscript'),
	fileId: z.uuidv7().describe('Identifier of the manuscript file'),
})

type GetFile = z.infer<typeof GetFileParamsSchema>

const CreateManuscriptSchema = ManuscriptModelSchema.pick({
	deadlineAt: true,
	name: true,
	description: true,
	status: true,
	publicationType: true,
	language: true,
	organizationId: true,
}).extend({
	tagIds: z
		.uuidv7()
		.array()
		.describe('List of tag identifiers associated with the manuscript')
		.default([]),
})

const UpdateManuscriptSchema = CreateManuscriptSchema.omit({
	organizationId: true,
}).partial()

type CreateManuscript = Omit<z.infer<typeof CreateManuscriptSchema>, 'file'>
type GetManuscript = z.infer<typeof GetManuscriptParamsSchema>
type UpdateManuscript = z.infer<typeof UpdateManuscriptSchema>

export {
	CreateManuscriptSchema,
	GetFileParamsSchema,
	GetManuscriptParamsSchema,
	ManuscriptModelSchema,
	UpdateManuscriptSchema,
}
export type { CreateManuscript, GetFile, GetManuscript, UpdateManuscript }
