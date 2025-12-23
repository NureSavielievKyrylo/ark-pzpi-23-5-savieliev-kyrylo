import type { CommonDependencies, DatabaseClient } from '@/core/types/deps.js'
import { activityLogTable } from '@/db/schema/activity-log.js'

export class ActivityLogRepository {
	private readonly db: DatabaseClient

	constructor({ db }: CommonDependencies) {
		this.db = db.client
	}

	async retirieveAll(): Promise<unknown[]> {
		const logs = await this.db.select().from(activityLogTable)

		return logs.map(({ userId, ...rest }) => ({
			performedBy: userId,
			...rest,
		}))
	}
}
