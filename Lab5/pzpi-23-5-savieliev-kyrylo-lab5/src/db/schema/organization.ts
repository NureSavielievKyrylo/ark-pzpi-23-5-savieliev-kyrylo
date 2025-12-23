import { pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { relations } from 'drizzle-orm'
import { memberTable } from './member.js'
import { manuscriptTable } from './manuscript.js'
import { tagTable } from './tag.js'

export const organizationTable = pgTable('organization', (t) => ({
	id: baseTableAttrs.id,
	createdAt: baseTableAttrs.createdAt,
	name: t.text().notNull(),
	slug: t.text().notNull().unique(),
	logo: t.text(),
	metadata: t.text(),
}))

export const organizationTableRelations = relations(
	organizationTable,
	({ many }) => ({
		memberTable: many(memberTable),
		manuscripts: many(manuscriptTable),
		tags: many(tagTable),
	}),
)
