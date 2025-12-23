import { eq } from 'drizzle-orm'
import { None, Some, type Option } from 'ts-results-es'
import type { Repository } from '../types/common.js'
import type { DatabaseClient } from '../types/deps.js'
import type { EntityTable } from '../types/entity.js'
import { buildExistsQuery } from '../utils/sql.js'

interface EntityRepositoryDependencies<
	ID extends string | number = string | number,
> {
	db: DatabaseClient
	table: EntityTable<ID>
}

export class EntityRepository<
	Entity extends { id: ID },
	ID extends string | number,
> implements Repository<Entity, ID>
{
	protected readonly db: DatabaseClient
	private readonly table: EntityTable<ID>

	constructor({ db, table }: EntityRepositoryDependencies<ID>) {
		this.db = db
		this.table = table
	}

	async findAll(): Promise<Entity[]> {
		return this.db.select().from(this.table) as Promise<Entity[]>
	}

	async findById(id: ID): Promise<Option<Entity>> {
		const rows = await this.db
			.select()
			.from(this.table)
			.where(eq(this.table.id, id))
			.limit(1)

		const entity = rows.at(0) as Entity | undefined

		return entity ? Some(entity) : None
	}

	async existsById(id: ID): Promise<boolean> {
		const rows = await this.db.execute<{ exists: boolean }>(
			buildExistsQuery({
				table: this.table,
				condition: eq(this.table.id, id),
			}),
		)

		return rows.at(0)?.exists ?? false
	}

	async deleteById(id: ID): Promise<void> {
		await this.db.delete(this.table).where(eq(this.table.id, id))
	}
}
