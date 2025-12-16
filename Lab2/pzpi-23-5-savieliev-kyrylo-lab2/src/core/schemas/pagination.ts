import z, { ZodType } from 'zod'

const PaginationQuerySchema = z.object({
	cursor: z.string().optional().describe('Cursor for pagination'),
	limit: z.coerce
		.number()
		.int()
		.positive()
		.max(100)
		.default(20)
		.describe('Number of items to return'),
})

type PaginationQuery = z.infer<typeof PaginationQuerySchema>

const PaginationMetaSchema = z.object({
	nextCursor: z.string().nullable(),
	hasMore: z.boolean(),
})

type PaginationMeta = z.infer<typeof PaginationMetaSchema>

const buildPaginatedSchema = (dataSchema: ZodType) => {
	return z.object({
		data: z.array(dataSchema),
		meta: PaginationMetaSchema,
	})
}

export { buildPaginatedSchema, PaginationMetaSchema, PaginationQuerySchema }
export type { PaginationQuery, PaginationMeta }
