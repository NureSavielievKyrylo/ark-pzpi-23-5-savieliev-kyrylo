import { sql } from 'drizzle-orm'
import { uuid, timestamp } from 'drizzle-orm/pg-core'

const pgUuidv7 = () => sql`uuidv7()`

const baseTableAttrs = {
	id: uuid().primaryKey().default(pgUuidv7()),
	createdAt: timestamp({ withTimezone: true, mode: 'date' })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({ withTimezone: true, mode: 'date' })
		.notNull()
		.defaultNow()
		.$onUpdateFn(() => new Date()),
}

export { baseTableAttrs, pgUuidv7 }
