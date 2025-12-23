import { checkPermissions } from '@/core/middlewares/check-permissions.middleware.js'
import { isAuthorized } from '@/core/middlewares/is-authorized.middleware.js'
import type { Routes } from '@/core/types/routes.js'
import {
	generateFailedHttpResponse,
	generateFailedValidationResponse,
} from '@/core/utils/schemas.js'
import z from 'zod'
import { createTag, deleteTag, updateTag } from '../handlers/index.js'
import {
	CreateTagShema,
	GetTagSchema,
	TagSchema,
	UpdateTagSchema,
} from '../schemas/index.js'

export const getTagsRoutes = (): Routes => ({
	routes: [
		{
			method: 'POST',
			url: '/tags',
			handler: createTag,
			preHandler: [isAuthorized, checkPermissions({ tag: ['create'] })],
			schema: {
				summary: 'Create a new Tag',
				description: 'Create a new tag for organizing manuscripts',
				tags: ['Tags'],
				body: CreateTagShema,
				response: {
					201: TagSchema.describe('Tag created successfully'),
					400: generateFailedValidationResponse().describe(
						'Request body does not match schema',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User is not authorized to create tag',
					),
					409: generateFailedHttpResponse(409).describe(
						'Tag with such name already exists in the organization',
					),
				},
			},
		},
		{
			method: 'PUT',
			url: '/organizations/:organizationId/tags/:tagId',
			handler: updateTag,
			preHandler: [isAuthorized, checkPermissions({ tag: ['update'] })],
			schema: {
				summary: 'Update an existing Tag',
				description: 'Update an existing tag in the organization',
				tags: ['Tags'],
				params: GetTagSchema,
				body: UpdateTagSchema,
				response: {
					204: z.void().describe('Tag updated successfully'),
					400: generateFailedValidationResponse().describe(
						"Request body or parameters don't not match schema",
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User is not authorized to update tag',
					),
					404: generateFailedHttpResponse(404).describe(
						'Tag with such id does not exist in the organization',
					),
				},
			},
		},
		{
			method: 'DELETE',
			url: '/organizations/:organizationId/tags/:tagId',
			handler: deleteTag,
			preHandler: [isAuthorized, checkPermissions({ tag: ['delete'] })],
			schema: {
				summary: 'Delete an existing Tag',
				description: 'Delete an existing tag in the organization',
				tags: ['Tags'],
				params: GetTagSchema,
				response: {
					204: z.void().describe('Tag deleted successfully'),
					400: generateFailedValidationResponse().describe(
						"Parameters don't not match schema",
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User is not authorized to delete tag',
					),
					404: generateFailedHttpResponse(404).describe(
						'Tag with such id does not exist in the organization',
					),
				},
			},
		},
	],
})
