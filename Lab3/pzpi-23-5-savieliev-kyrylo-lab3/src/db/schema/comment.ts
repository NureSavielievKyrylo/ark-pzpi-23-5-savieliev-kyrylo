import { pgTable, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { memberTable } from './member.js'
import { manuscriptTable } from './manuscript.js'
import { relations } from 'drizzle-orm'

export const commentTable = pgTable('comment', (t) => ({
	...baseTableAttrs,
	text: t.text().notNull(),
	manuscriptId: t
		.uuid()
		.notNull()
		.references(() => manuscriptTable.id, { onDelete: 'cascade' }),
	authorId: t
		.uuid()
		.notNull()
		.references(() => memberTable.id, { onDelete: 'cascade' }),
	parentId: t
		.uuid()
		.references((): AnyPgColumn => commentTable.id, { onDelete: 'cascade' }),
}))

export const commentTableRelations = relations(commentTable, ({ one }) => ({
	manuscript: one(manuscriptTable, {
		fields: [commentTable.manuscriptId],
		references: [manuscriptTable.id],
	}),
	author: one(memberTable, {
		fields: [commentTable.authorId],
		references: [memberTable.id],
	}),
}))
