import { relations } from 'drizzle-orm'
import { pgTable, unique } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { manuscriptTagTable } from './manuscript-tag.js'
import { organizationTable } from './organization.js'

export const tagTable = pgTable(
	'tag',
	(t) => ({
		id: baseTableAttrs.id,
		createdAt: baseTableAttrs.createdAt,
		name: t.varchar().notNull().unique(),
		color: t.varchar().notNull(),
		organizationId: t
			.uuid()
			.notNull()
			.references(() => organizationTable.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade',
			}),
	}),
	(t) => [unique('tag_name_org_uidx').on(t.name, t.organizationId)],
)

export const tagsTableRelations = relations(tagTable, ({ one, many }) => ({
	manuscripts: many(manuscriptTagTable),
	organization: one(organizationTable, {
		fields: [tagTable.organizationId],
		references: [organizationTable.id],
	}),
}))
