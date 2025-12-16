import { relations } from 'drizzle-orm'
import { pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { manuscriptTable } from './manuscript.js'
import { memberTable } from './member.js'

export const publishingStageTable = pgTable('publishing_stage', (t) => ({
	id: baseTableAttrs.id,
	createdAt: baseTableAttrs.createdAt,
	finishedAt: t.timestamp({ withTimezone: true, mode: 'date' }),
	deadlineAt: t.timestamp({ withTimezone: true, mode: 'date' }),
	name: t.varchar().notNull(),
	description: t.text(),
	completedBy: t
		.uuid()
		.references(() => memberTable.id, { onDelete: 'set null' }),
	createdBy: t
		.uuid()
		.notNull()
		.references(() => memberTable.id, { onDelete: 'cascade' }),
	manuscriptId: t
		.uuid()
		.notNull()
		.references(() => manuscriptTable.id, { onDelete: 'cascade' }),
}))

export const publishingStageTableRelations = relations(
	publishingStageTable,
	({ one }) => ({
		manuscript: one(manuscriptTable, {
			fields: [publishingStageTable.manuscriptId],
			references: [manuscriptTable.id],
		}),
		completedByMember: one(memberTable, {
			fields: [publishingStageTable.completedBy],
			references: [memberTable.id],
			relationName: 'completedBy',
		}),
		createdByMember: one(memberTable, {
			fields: [publishingStageTable.createdBy],
			references: [memberTable.id],
			relationName: 'createdBy',
		}),
	}),
)
