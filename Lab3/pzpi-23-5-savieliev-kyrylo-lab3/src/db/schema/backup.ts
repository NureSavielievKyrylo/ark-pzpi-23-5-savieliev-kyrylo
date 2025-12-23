import { pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'

export const backupTable = pgTable('backup', (t) => ({
	id: baseTableAttrs.id,
	createdAt: baseTableAttrs.createdAt,
	fileName: t.varchar().notNull().unique(),
	sizeInBytes: t.integer().notNull(),
	url: t.text().notNull(),
}))
