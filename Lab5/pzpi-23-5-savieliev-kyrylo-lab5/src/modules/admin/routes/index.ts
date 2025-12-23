import type { Routes } from '@/core/types/routes.js'
import { createBackup, listBackups, restoreBackup } from '../handlers/index.js'
import { isAuthorized } from '@/core/middlewares/is-authorized.middleware.js'
import { isAdmin } from '@/core/middlewares/is-admin.middleware.js'
import {
	BackupListSchema,
	BackupMetadataSchema,
	RestoreParamsSchema,
	RestoreSuccessSchema,
} from '../schemas/index.js'
import { generateFailedHttpResponse } from '@/core/utils/schemas.js'

export const getAdminRoutes = (): Routes => ({
	routes: [
		{
			method: 'POST',
			url: '/admin/backups',
			handler: createBackup,
			preHandler: [isAuthorized, isAdmin],
			schema: {
				summary: 'Create database backup',
				description: 'Create a full database backup and upload to S3',
				tags: ['Admin'],
				response: {
					201: BackupMetadataSchema.describe('Backup created successfully'),
					401: generateFailedHttpResponse(401).describe(
						'User is not authorized',
					),
					403: generateFailedHttpResponse(403).describe(
						'User does not have admin rights',
					),
					500: generateFailedHttpResponse(500).describe(
						'Backup operation failed',
					),
				},
			},
		},
		{
			method: 'GET',
			url: '/admin/backups',
			handler: listBackups,
			preHandler: [isAuthorized, isAdmin],
			schema: {
				summary: 'Retrieve list of database backups',
				description: 'List all database backups',
				tags: ['Admin'],
				response: {
					200: BackupListSchema.describe('List of all backups'),
					401: generateFailedHttpResponse(401).describe(
						'User is not authorized',
					),
					403: generateFailedHttpResponse(403).describe(
						'User does not have admin rights',
					),
				},
			},
		},
		{
			method: 'POST',
			url: '/admin/backups/:fileName/restore',
			handler: restoreBackup,
			preHandler: [isAuthorized, isAdmin],
			schema: {
				summary: 'Restore database from backup',
				description: 'Restore database from a specific backup',
				tags: ['Admin'],
				params: RestoreParamsSchema,
				response: {
					200: RestoreSuccessSchema.describe('Database restored successfully'),
					401: generateFailedHttpResponse(401).describe(
						'User is not authorized',
					),
					403: generateFailedHttpResponse(403).describe(
						'User does not have admin rights',
					),
					404: generateFailedHttpResponse(404).describe('Backup not found'),
					500: generateFailedHttpResponse(500).describe(
						'Restore operation failed',
					),
				},
			},
		},
	],
})
