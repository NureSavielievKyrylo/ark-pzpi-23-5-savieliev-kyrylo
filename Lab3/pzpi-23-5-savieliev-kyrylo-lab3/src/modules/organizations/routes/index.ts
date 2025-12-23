import { checkPermissions } from '@/core/middlewares/check-permissions.middleware.js'
import { isAuthorized } from '@/core/middlewares/is-authorized.middleware.js'
import {
	buildPaginatedSchema,
	PaginationQuerySchema,
} from '@/core/schemas/pagination.js'
import {
	generateFailedHttpResponse,
	generateFailedValidationResponse,
} from '@/core/utils/schemas.js'
import { TagSchema } from '@/modules/tags/schemas/index.js'
import {
	getOrganizationManuscripts,
	getOrganizationTags,
} from '../handlers/index.js'
import { GetOrganizationSchema } from '../schemas/index.js'
import { ManuscriptModelSchema } from '@/modules/manuscripts/schemas/index.js'
import { schemaWithTags } from '@/modules/tags/utils/index.js'

export const getOrganizationRoutes = () => ({
	routes: [
		{
			method: 'GET',
			url: '/organizations/:id/manuscripts',
			handler: getOrganizationManuscripts,
			preHandler: [isAuthorized, checkPermissions({ manuscript: ['read'] })],
			schema: {
				summary: 'Get manuscripts for an organization with pagination',
				description:
					'Retrieve manuscripts associated with the organization with cursor-based pagination. Use the nextCursor from the response to load more manuscripts.',
				tags: ['Organizations'],
				params: GetOrganizationSchema,
				querystring: PaginationQuerySchema,
				response: {
					200: buildPaginatedSchema(
						schemaWithTags(ManuscriptModelSchema),
					).describe(
						'Manuscripts retrieved successfully with nextCursor for infinite scroll',
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
					404: generateFailedHttpResponse(404).describe(
						'Organization not found',
					),
				},
			},
		},
		{
			method: 'GET',
			url: '/organizations/:id/tags',
			handler: getOrganizationTags,
			preHandler: [isAuthorized, checkPermissions({ tag: ['read'] })],
			schema: {
				summary: 'Get tags for an organization with pagination',
				description:
					'Retrieve tags associated with the organization with cursor-based pagination. Use the nextCursor from the response to load more tags.',
				tags: ['Organizations'],
				params: GetOrganizationSchema,
				querystring: PaginationQuerySchema,
				response: {
					200: buildPaginatedSchema(TagSchema).describe(
						'Tags retrieved successfully with nextCursor for infinite scroll',
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
					404: generateFailedHttpResponse(404).describe(
						'Organization not found',
					),
				},
			},
		},
	],
})
