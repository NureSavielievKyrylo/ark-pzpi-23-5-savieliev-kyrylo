import { index, pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'

export const verificationTable = pgTable(
	'verification',
	(t) => ({
		...baseTableAttrs,
		expiresAt: t.timestamp({ withTimezone: true, mode: 'date' }).notNull(),
		identifier: t.text().notNull(),
		value: t.text().notNull(),
	}),
	(t) => [index('verification_identifier_idx').on(t.identifier)],
)
