import { pgTable, primaryKey } from 'drizzle-orm/pg-core'
import { manuscriptTable } from './manuscript.js'
import { tagTable } from './tag.js'
import { relations } from 'drizzle-orm'

export const manuscriptTagTable = pgTable(
	'manuscript_tag',
	(t) => ({
		manuscriptId: t
			.uuid()
			.notNull()
			.references(() => manuscriptTable.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade',
			}),
		tagId: t
			.uuid()
			.notNull()
			.references(() => tagTable.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade',
			}),
	}),
	(t) => [primaryKey({ columns: [t.manuscriptId, t.tagId] })],
)

export const manuscriptTagTableRelations = relations(
	manuscriptTagTable,
	({ one }) => ({
		manuscript: one(manuscriptTable, {
			fields: [manuscriptTagTable.manuscriptId],
			references: [manuscriptTable.id],
		}),
		tag: one(tagTable, {
			fields: [manuscriptTagTable.tagId],
			references: [tagTable.id],
		}),
	}),
)
