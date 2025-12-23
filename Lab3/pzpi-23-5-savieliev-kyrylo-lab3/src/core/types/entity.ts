import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

type EntityIdentifier<T extends string | number> = PgColumn<{
	name: 'id'
	tableName: string
	dataType: 'string' | 'number'
	columnType: T extends string
		? 'PgText' | 'PgUUID' | 'PgVarchar'
		: 'PgInteger' | 'PgBigInt'
	data: T
	driverParam: T
	notNull: boolean
	hasDefault: boolean
	isPrimaryKey: boolean
	isAutoincrement: boolean
	hasRuntimeDefault: boolean
	enumValues: undefined
	baseColumn: never
}>

type EntityTable<ID extends string | number> = PgTable<{
	name: string
	schema: string | undefined
	columns: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: PgColumn<any>
	}
	dialect: 'pg'
}> & {
	id: EntityIdentifier<ID>
}

export type { EntityIdentifier, EntityTable }
