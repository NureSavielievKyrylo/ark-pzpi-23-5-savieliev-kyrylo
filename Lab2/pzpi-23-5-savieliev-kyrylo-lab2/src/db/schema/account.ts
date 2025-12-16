import { relations } from 'drizzle-orm'
import { index, pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { userTable } from './user.js'

export const accountTable = pgTable(
	'account',
	(t) => ({
		...baseTableAttrs,
		accountId: t.text().notNull(),
		providerId: t.text().notNull(),
		userId: t
			.uuid()
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		accessToken: t.text(),
		refreshToken: t.text(),
		idToken: t.text(),
		accessTokenExpiresAt: t.timestamp({ withTimezone: true }),
		refreshTokenExpiresAt: t.timestamp({ withTimezone: true }),
		scope: t.text(),
		password: t.text(),
	}),
	(table) => [index('account_user_id_idx').on(table.userId)],
)

export const accountRelations = relations(accountTable, ({ one }) => ({
	userTable: one(userTable, {
		fields: [accountTable.userId],
		references: [userTable.id],
	}),
}))
