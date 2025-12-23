import { type SQL, sql } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'

interface BuildExistsQueryArgs {
	table: PgTable
	condition: SQL<unknown>
}

export const buildExistsQuery = ({
	table,
	condition,
}: BuildExistsQueryArgs): SQL<{ exists: boolean }> => {
	return sql<{
		exists: boolean
	}>`select exists (select 1 from ${table} where ${condition}) as "exists"`
}

export class SqlExpressions {
	private expressions: SQL[]

	constructor(...expressions: SQL[]) {
		this.expressions = expressions
	}

	add(expression: SQL): SqlExpressions {
		this.expressions.push(expression)
		return this
	}

	toArray(): SQL[] {
		return this.expressions
	}
}
