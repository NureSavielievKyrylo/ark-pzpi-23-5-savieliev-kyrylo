import { relations } from 'drizzle-orm'
import { pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { accountTable } from './account.js'
import { sessionTable } from './session.js'

export const userTable = pgTable('user', (t) => ({
	...baseTableAttrs,
	name: t.text().notNull(),
	email: t.text().notNull().unique(),
	emailVerified: t.boolean().default(false).notNull(),
	image: t.text(),
	username: t.text().unique(),
	displayUsername: t.text(),
	role: t.text(),
	banned: t.boolean().default(false),
	banReason: t.text(),
	banExpires: t.timestamp({ withTimezone: true }),
	lastLoginMethod: t.text(),
	locale: t.text().default('en'),
}))

export const userTableRelations = relations(userTable, ({ many }) => ({
	sessionTable: many(sessionTable),
	accountTable: many(accountTable),
}))
