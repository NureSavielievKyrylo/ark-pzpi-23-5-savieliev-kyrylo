import { check, pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { memberTable } from './member.js'
import { sql } from 'drizzle-orm'
import { manuscriptTable } from './manuscript.js'

export const fileTable = pgTable(
	'file',
	(t) => ({
		id: baseTableAttrs.id,
		uploadedAt: baseTableAttrs.createdAt,
		name: t.varchar().notNull(),
		mimeType: t.varchar().notNull(),
		sizeInBytes: t.integer().notNull(),
		path: t.text().unique().notNull(),
		uploadedBy: t
			.uuid()
			.references(() => memberTable.id, { onDelete: 'set null' }),
		manuscriptId: t
			.uuid()
			.notNull()
			.references(() => manuscriptTable.id, { onDelete: 'cascade' }),
	}),
	(t) => [check('check_file_size_positive', sql`${t.sizeInBytes} > 0`)],
)
