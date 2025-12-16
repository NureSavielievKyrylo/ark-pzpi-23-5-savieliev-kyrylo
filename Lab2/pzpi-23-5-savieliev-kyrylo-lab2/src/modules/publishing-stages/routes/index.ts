import { checkPermissions } from '@/core/middlewares/check-permissions.middleware.js'
import { isAuthorized } from '@/core/middlewares/is-authorized.middleware.js'
import { PaginationQuerySchema } from '@/core/schemas/pagination.js'
import type { Routes } from '@/core/types/routes.js'
import {
	generateFailedHttpResponse,
	generateFailedValidationResponse,
} from '@/core/utils/schemas.js'
import { GetManuscriptParamsSchema } from '@/modules/manuscripts/schemas/index.js'
import z from 'zod'
import {
	createPublishingStage,
	deletePublishingStage,
	getManuscriptPublishingStages,
	getPublishingStage,
	updatePublishingStage,
} from '../handlers/index.js'
import { checkPublishingStagePermissions } from '../middlewares/check-publishing-stage-permissions.middleware.js'
import {
	CreatePublishingStageSchema,
	GetPublishingStageParamsSchema,
	PaginatedPublishingStagesSchema,
	PublishingStageSchema,
	UpdatePublishingStageSchema,
} from '../schemas/index.js'

export const getPublishingStagesRoutes = (): Routes => ({
	routes: [
		{
			method: 'GET',
			url: '/manuscripts/:id/publishing-stages',
			handler: getManuscriptPublishingStages,
			preHandler: [isAuthorized, checkPermissions({ manuscript: ['read'] })],
			schema: {
				summary: 'Get publishing stages for a manuscript',
				description:
					'Retrieve publishing stages with cursor-based pagination for a manuscript',
				tags: ['Publishing Stages'],
				params: GetManuscriptParamsSchema,
				querystring: PaginationQuerySchema,
				response: {
					200: PaginatedPublishingStagesSchema.describe(
						'Publishing stages retrieved successfully with nextCursor for infinite scroll',
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
			url: '/publishing-stages/:id',
			handler: getPublishingStage,
			preHandler: [isAuthorized, checkPermissions({ manuscript: ['read'] })],
			schema: {
				summary: 'Get publishing stage by ID',
				description: 'Retrieve a single publishing stage',
				tags: ['Publishing Stages'],
				params: GetPublishingStageParamsSchema,
				response: {
					200: PublishingStageSchema.describe(
						'Publishing stage retrieved successfully',
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
					404: generateFailedHttpResponse(404).describe(
						'Publishing stage not found',
					),
				},
			},
		},
		{
			method: 'POST',
			url: '/manuscripts/:id/publishing-stages',
			handler: createPublishingStage,
			preHandler: [isAuthorized, checkPermissions({ manuscript: ['update'] })],
			schema: {
				summary: 'Create a publishing stage',
				description: 'Create a new publishing stage for a manuscript',
				tags: ['Publishing Stages'],
				params: GetManuscriptParamsSchema,
				body: CreatePublishingStageSchema,
				response: {
					201: PublishingStageSchema.describe(
						'Publishing stage created successfully',
					),
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
						'Failed to create publishing stage',
					),
				},
			},
		},
		{
			method: 'PUT',
			url: '/publishing-stages/:id',
			handler: updatePublishingStage,
			preHandler: [isAuthorized, checkPublishingStagePermissions('update')],
			schema: {
				summary: 'Update a publishing stage',
				description: 'Update publishing stage details (creator or admin only)',
				tags: ['Publishing Stages'],
				params: GetPublishingStageParamsSchema,
				body: UpdatePublishingStageSchema,
				response: {
					204: z.void().describe('Publishing stage updated successfully'),
					400: generateFailedValidationResponse().describe('Invalid request'),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User is not the stage creator',
					),
					404: generateFailedHttpResponse(404).describe(
						'Publishing stage not found',
					),
					500: generateFailedHttpResponse(500).describe(
						'Failed to update publishing stage',
					),
				},
			},
		},
		{
			method: 'DELETE',
			url: '/publishing-stages/:id',
			handler: deletePublishingStage,
			preHandler: [isAuthorized, checkPublishingStagePermissions('delete')],
			schema: {
				summary: 'Delete a publishing stage',
				description: 'Delete a publishing stage (creator or admin only)',
				tags: ['Publishing Stages'],
				params: GetPublishingStageParamsSchema,
				response: {
					204: z.void().describe('Publishing stage deleted successfully'),
					400: generateFailedValidationResponse().describe(
						'Invalid ID parameter',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authenticated',
					),
					403: generateFailedHttpResponse(403).describe(
						'User lacks delete permissions',
					),
					404: generateFailedHttpResponse(404).describe(
						'Publishing stage not found',
					),
				},
			},
		},
	],
})
