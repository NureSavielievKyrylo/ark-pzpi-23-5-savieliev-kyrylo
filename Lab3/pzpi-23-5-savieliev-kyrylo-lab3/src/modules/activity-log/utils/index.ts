import type { CommonDependencies } from '@/core/types/deps.js'
import { activityLogTable } from '@/db/schema/activity-log.js'
import { ACTIVITY_ACTION } from '../constants/index.js'
import type { ActivityLog, LogData } from '../types/index.js'

export const createActivityLog = (deps: CommonDependencies): ActivityLog => {
	const db = deps.db.client

	return Object.values(ACTIVITY_ACTION).reduce((acc, action) => {
		const key = `log${action.charAt(0).toUpperCase()}${action
			.slice(1)
			.toLowerCase()}` as keyof ActivityLog

		acc[key] = async ({ performedBy, ...rest }: LogData): Promise<void> => {
			await db.insert(activityLogTable).values({
				action,
				userId: performedBy,
				...rest,
			})
		}

		return acc
	}, {} as ActivityLog)
}
