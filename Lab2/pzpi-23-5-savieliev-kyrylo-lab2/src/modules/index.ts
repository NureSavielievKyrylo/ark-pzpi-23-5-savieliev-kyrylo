import { HealthCheckSchema } from '@/core/schemas/common.js'
import type { Routes } from '@/core/types/routes.js'
import { getCommentsRoutes } from './comments/routes/index.js'
import { getManuscriptsRoutes } from './manuscripts/routes/index.js'
import { getPublishingStagesRoutes } from './publishing-stages/routes/index.js'
import { getTagsRoutes } from './tags/routes/index.js'
import { getOrganizationRoutes } from './organizations/routes/index.js'

export const getRoutes = (): Routes => {
	return {
		routes: [
			{
				method: 'GET',
				url: '/health',
				handler: (_, reply) => {
					const data = {
						uptime: process.uptime(),
						message: 'Healthy!',
						date: new Date(),
					}

					return reply.status(200).send(data)
				},
				schema: {
					tags: ['System Check'],
					summary: 'Get system status',
					response: {
						200: HealthCheckSchema,
					},
				},
			},
			...getManuscriptsRoutes().routes,
			...getTagsRoutes().routes,
			...getOrganizationRoutes().routes,
			...getCommentsRoutes().routes,
			...getPublishingStagesRoutes().routes,
		],
	}
}
