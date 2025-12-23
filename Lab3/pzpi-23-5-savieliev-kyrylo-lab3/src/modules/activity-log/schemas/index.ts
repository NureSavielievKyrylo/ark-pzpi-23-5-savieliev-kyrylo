import { ENTITY } from '@/core/constants/entities.js'
import z from 'zod'
import { ACTIVITY_ACTION, LOG_SEVERITY } from '../constants/index.js'

export const ActivityLogSchema = z.object({
	id: z.uuidv7().describe('Unique identifier for the activity log'),
	performedAt: z.date().describe('Timestamp when the activity was performed'),
	entity: z
		.enum(Object.values(ENTITY))
		.describe('The entity on which the action was performed'),
	action: z
		.enum(Object.values(ACTIVITY_ACTION))
		.describe('The action that was performed'),
	description: z.string().describe('Description of the activity performed'),
	severity: z
		.enum(Object.values(LOG_SEVERITY))
		.describe('Severity level of the activity log'),
	performedBy: z
		.string()
		.describe('Identifier of the user who performed the action'),
})
