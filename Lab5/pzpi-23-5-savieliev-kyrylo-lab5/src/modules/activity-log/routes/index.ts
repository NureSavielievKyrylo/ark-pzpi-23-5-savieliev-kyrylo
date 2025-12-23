import type { Routes } from '@/core/types/routes.js'
import { retrieveActivityLogs } from '../handlers/index.js'
import { isAuthorized } from '@/core/middlewares/is-authorized.middleware.js'
import { isAdmin } from '@/core/middlewares/is-admin.middleware.js'
import { ActivityLogSchema } from '../schemas/index.js'
import { generateFailedHttpResponse } from '@/core/utils/schemas.js'

export const getActivityLogRoutes = (): Routes => ({
	routes: [
		{
			method: 'GET',
			url: '/admin/activity-logs',
			handler: retrieveActivityLogs,
			preHandler: [isAuthorized, isAdmin],
			schema: {
				summary: 'Retrieve activity logs',
				description: 'Retrieve all activity logs',
				tags: ['Admin'],
				response: {
					200: ActivityLogSchema.array().describe(
						'Activity logs retrieved successfully',
					),
					401: generateFailedHttpResponse(401).describe(
						'User is not authorized',
					),
					403: generateFailedHttpResponse(403).describe(
						`User does not have rights to retrieve activity logs`,
					),
				},
			},
		},
	],
})
