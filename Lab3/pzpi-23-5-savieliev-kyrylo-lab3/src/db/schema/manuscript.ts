import { relations } from 'drizzle-orm'
import { index, pgTable, unique } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { commentTable } from './comment.js'
import { manuscriptTagTable } from './manuscript-tag.js'
import { organizationTable } from './organization.js'
import { publishingStageTable } from './publishing-stage.js'

export const manuscriptTable = pgTable(
	'manuscript',
	(t) => ({
		...baseTableAttrs,
		deadlineAt: t.timestamp({ withTimezone: true, mode: 'date' }),
		name: t.varchar().notNull(),
		description: t.text(),
		publicationType: t.varchar().notNull(),
		language: t.varchar().notNull(),
		status: t.varchar().notNull(),
		organizationId: t
			.uuid()
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
	}),
	(t) => [
		index('manuscript_status_idx').on(t.status, t.organizationId),
		index('manuscript_type_idx').on(t.publicationType, t.organizationId),
		index('manuscript_language_idx').on(t.language, t.organizationId),
		unique('manuscript_name_org_uidx').on(t.name, t.organizationId),
	],
)

export const manuscriptTableRelations = relations(
	manuscriptTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [manuscriptTable.organizationId],
			references: [organizationTable.id],
		}),
		tags: many(manuscriptTagTable),
		comments: many(commentTable),
		publishingStages: many(publishingStageTable),
	}),
)
