import { relations, sql } from 'drizzle-orm'
import { check, index, pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { userTable } from './user.js'

export const activityLogTable = pgTable(
	'activity_log',
	(t) => ({
		id: baseTableAttrs.id,
		performedAt: baseTableAttrs.createdAt,
		entity: t.varchar().notNull(),
		action: t.varchar().notNull(),
		description: t.varchar().notNull(),
		severity: t.varchar().notNull(),
		userId: t.uuid().references(() => userTable.id, { onDelete: 'set null' }),
	}),
	(t) => [
		check(
			'check_activity_log_severity',
			sql`${t.severity} in ('info', 'warning', 'error', 'trace')`,
		),
		index('activity_log_user_idx').on(t.userId),
		index('activity_log_action_idx').on(t.action),
		index('activity_log_entity_idx').on(t.entity),
		index('activity_log_severity_idx').on(t.severity),
	],
)

export const activityLogTableRelations = relations(
	activityLogTable,
	({ one }) => ({
		user: one(userTable, {
			fields: [activityLogTable.userId],
			references: [userTable.id],
		}),
	}),
)
