import { relations } from 'drizzle-orm'
import { index, pgTable } from 'drizzle-orm/pg-core'
import { baseTableAttrs } from '../utils.js'
import { organizationTable } from './organization.js'
import { userTable } from './user.js'

export const invitationTable = pgTable(
	'invitation',
	(t) => ({
		id: baseTableAttrs.id,
		expiresAt: t.timestamp({ withTimezone: true, mode: 'date' }).notNull(),
		organizationId: t
			.uuid()
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
		email: t.text().notNull(),
		role: t.text(),
		status: t.text().default('pending').notNull(),
		inviterId: t
			.uuid()
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
	}),
	(t) => [
		index('invitation_organization_status_idx').on(t.organizationId, t.status),
	],
)

export const invitationTableRelations = relations(
	invitationTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [invitationTable.organizationId],
			references: [organizationTable.id],
		}),
		inviter: one(userTable, {
			fields: [invitationTable.inviterId],
			references: [userTable.id],
		}),
	}),
)
