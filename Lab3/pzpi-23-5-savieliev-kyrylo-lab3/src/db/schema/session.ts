import { relations } from 'drizzle-orm'
import { index, pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { userTable } from './user.js'

export const sessionTable = pgTable(
	'session',
	(t) => ({
		...baseTableAttrs,
		expiresAt: t.timestamp({ withTimezone: true }).notNull(),
		token: t.text().notNull().unique(),
		ipAddress: t.text(),
		userAgent: t.text(),
		userId: t
			.uuid()
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		impersonatedBy: t.text(),
	}),
	(t) => [index('session_user_id_idx').on(t.userId)],
)

export const sessionTableRelations = relations(sessionTable, ({ one }) => ({
	userTable: one(userTable, {
		fields: [sessionTable.userId],
		references: [userTable.id],
	}),
}))
