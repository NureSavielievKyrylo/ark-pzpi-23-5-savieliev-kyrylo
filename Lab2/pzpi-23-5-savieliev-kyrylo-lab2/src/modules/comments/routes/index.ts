import { checkPermissions } from '@/core/middlewares/check-permissions.middleware.js'
import { isAuthorized } from '@/core/middlewares/is-authorized.middleware.js'
import {
	buildPaginatedSchema,
	PaginationQuerySchema,
} from '@/core/schemas/pagination.js'
import type { Routes } from '@/core/types/routes.js'
import {
	generateFailedHttpResponse,
	generateFailedValidationResponse,
} from '@/core/utils/schemas.js'
import { GetManuscriptParamsSchema } from '@/modules/manuscripts/schemas/index.js'
import z from 'zod'
import {
	createComment,
	createReply,
	deleteComment,
	getComment,
	getManuscriptComments,
	updateComment,
} from '../handlers/index.js'
import { checkCommentPermissions } from '../middlewares/check-comment-permissions.middleware.js'
import {
	CommentWithAuthorSchema,
	CreateCommentSchema,
	CreateReplyParamsSchema,
	GetCommentParamsSchema,
	UpdateCommentSchema,
} from '../schemas/index.js'

export const getCommentsRoutes = (): Routes => ({
	routes: [
		{
			method: 'GET',
			url: '/manuscripts/:id/comments',
			handler: getManuscriptComments,
			preHandler: [isAuthorized, checkPermissions({ manuscript: ['read'] })],
			schema: {
				summary: 'Get comments for a manuscript',
				description:
					'Retrieve comments with cursor-based pagination and nested replies for a manuscript. Use the nextCursor from the response to load more comments.',
				tags: ['Comments'],
				params: GetManuscriptParamsSchema,
				querystring: PaginationQuerySchema,
				response: {
					200: buildPaginatedSchema(CommentWithAuthorSchema).describe(
						'Comments retrieved successfully with nextCursor for infinite scroll',
					),
					400: generateFailedValidationResponse().describe(
						'Invalid parameters',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User is not authorized',
					),
					404: generateFailedHttpResponse(404).describe('Manuscript not found'),
				},
			},
		},
		{
			method: 'GET',
			url: '/comments/:id',
			handler: getComment,
			preHandler: [isAuthorized, checkPermissions({ manuscript: ['read'] })],
			schema: {
				summary: 'Get comment by ID',
				description: 'Retrieve a single comment with nested replies',
				tags: ['Comments'],
				params: GetCommentParamsSchema,
				response: {
					200: CommentWithAuthorSchema.describe(
						'Comment retrieved successfully',
					),
					400: generateFailedValidationResponse().describe(
						'Invalid ID parameter',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User is not authorized',
					),
					404: generateFailedHttpResponse(404).describe('Comment not found'),
				},
			},
		},
		{
			method: 'POST',
			url: '/manuscripts/:id/comments',
			handler: createComment,
			preHandler: [isAuthorized, checkPermissions({ manuscript: ['read'] })],
			schema: {
				summary: 'Create a comment',
				description: 'Create a new top-level comment on a manuscript',
				tags: ['Comments'],
				params: GetManuscriptParamsSchema,
				body: CreateCommentSchema,
				response: {
					201: CommentWithAuthorSchema.describe('Comment created successfully'),
					400: generateFailedValidationResponse().describe(
						'Invalid request body',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User is not authorized',
					),
					404: generateFailedHttpResponse(404).describe('Manuscript not found'),
					500: generateFailedHttpResponse(500).describe(
						'Failed to create comment',
					),
				},
			},
		},
		{
			method: 'POST',
			url: '/manuscripts/:manuscriptId/comments/:commentId/reply',
			handler: createReply,
			preHandler: [isAuthorized, checkPermissions({ manuscript: ['read'] })],
			schema: {
				summary: 'Reply to a comment',
				description: 'Create a reply to an existing comment',
				tags: ['Comments'],
				params: CreateReplyParamsSchema,
				body: CreateCommentSchema,
				response: {
					201: CommentWithAuthorSchema.describe('Reply created successfully'),
					400: generateFailedValidationResponse().describe(
						'Invalid request body',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User is not authorized',
					),
					404: generateFailedHttpResponse(404).describe(
						'Manuscript or comment not found',
					),
					500: generateFailedHttpResponse(500).describe(
						'Failed to create reply',
					),
				},
			},
		},
		{
			method: 'PUT',
			url: '/comments/:id',
			handler: updateComment,
			preHandler: [isAuthorized, checkCommentPermissions('update')],
			schema: {
				summary: 'Update a comment',
				description: 'Update comment text (author only)',
				tags: ['Comments'],
				params: GetCommentParamsSchema,
				body: UpdateCommentSchema,
				response: {
					204: z.void().describe('Comment updated successfully'),
					400: generateFailedValidationResponse().describe('Invalid request'),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User is not the comment author',
					),
					404: generateFailedHttpResponse(404).describe('Comment not found'),
					500: generateFailedHttpResponse(500).describe(
						'Failed to update comment',
					),
				},
			},
		},
		{
			method: 'DELETE',
			url: '/comments/:id',
			handler: deleteComment,
			preHandler: [isAuthorized, checkCommentPermissions('delete')],
			schema: {
				summary: 'Delete a comment',
				description: 'Delete a comment (author or admin only)',
				tags: ['Comments'],
				params: GetCommentParamsSchema,
				response: {
					204: z.void().describe('Comment deleted successfully'),
					400: generateFailedValidationResponse().describe(
						'Invalid ID parameter',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User lacks delete permissions',
					),
					404: generateFailedHttpResponse(404).describe('Comment not found'),
				},
			},
		},
	],
})
