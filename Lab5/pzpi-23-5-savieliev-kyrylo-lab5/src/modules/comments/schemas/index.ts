import z from 'zod'

const CommentSchema = z.strictObject({
	id: z.uuidv7().describe('Unique identifier of the comment'),
	createdAt: z.coerce.date().describe('Creation timestamp'),
	updatedAt: z.coerce.date().describe('Last update timestamp'),
	text: z.string().min(1).max(2000).describe('Comment text content'),
	manuscriptId: z.uuidv7().describe('Manuscript identifier'),
	authorId: z.uuidv7().describe('Author member identifier'),
	parentId: z
		.uuidv7()
		.nullable()
		.describe('Parent comment identifier for replies'),
})

const CommentAuthorSchema = z.strictObject({
	id: z.uuidv7(),
	name: z.string(),
	email: z.string().email(),
	role: z.string(),
	image: z.string().nullable(),
})

const CommentWithAuthorSchema = CommentSchema.extend({
	author: CommentAuthorSchema,
	get replies() {
		return CommentWithAuthorSchema.array()
	},
})

const CreateCommentSchema = z.strictObject({
	text: z
		.string()
		.min(1, 'Comment text cannot be empty')
		.max(2000, 'Comment text cannot exceed 2000 characters')
		.describe('Comment text content'),
})

const CreateReplyParamsSchema = z.strictObject({
	manuscriptId: z.uuidv7().describe('Manuscript identifier'),
	commentId: z.uuidv7().describe('Parent comment identifier'),
})

const CreateReplySchema = CreateCommentSchema

const GetCommentParamsSchema = z.strictObject({
	id: z.uuidv7().describe('Comment identifier'),
})

const UpdateCommentSchema = z.strictObject({
	text: z
		.string()
		.min(1, 'Comment text cannot be empty')
		.max(2000, 'Comment text cannot exceed 2000 characters')
		.describe('Updated comment text'),
})

type CreateComment = z.infer<typeof CreateCommentSchema>
type GetCommentParams = z.infer<typeof GetCommentParamsSchema>
type CreateReplyParams = z.infer<typeof CreateReplyParamsSchema>
type UpdateComment = z.infer<typeof UpdateCommentSchema>

export {
	CommentAuthorSchema,
	CommentSchema,
	CommentWithAuthorSchema,
	CreateCommentSchema,
	CreateReplyParamsSchema,
	CreateReplySchema,
	GetCommentParamsSchema,
	UpdateCommentSchema,
}

export type {
	CreateComment,
	CreateReplyParams,
	GetCommentParams,
	UpdateComment,
}
