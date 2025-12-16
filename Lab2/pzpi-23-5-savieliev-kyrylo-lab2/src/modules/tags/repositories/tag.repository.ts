import { DUPLICATE_KEY_ERR_CODE } from '@/core/constants/db.js'
import { EntityRepository } from '@/core/repositories/entity.repository.js'
import type { Paginated } from '@/core/types/pagination.js'
import { InternalServerError, type HttpError } from '@/core/utils/errors.js'
import {
	extractPaginationMetadata,
	toPaginated,
} from '@/core/utils/pagination.js'
import { buildExistsQuery, SqlExpressions } from '@/core/utils/sql.js'
import { manuscriptTagTable } from '@/db/schema/manuscript-tag.js'
import { tagTable } from '@/db/schema/tag.js'
import type { Tag } from '@/db/types.js'
import { and, desc, eq, getTableColumns, gt, SQL } from 'drizzle-orm'
import postgres from 'postgres'
import { Err, None, Ok, type Result } from 'ts-results-es'
import { TagAlreadyExistsError } from '../errors/index.js'
import type { CreateTag, UpdateTag } from '../schemas/index.js'
import type {
	FindTagsByOrganizationArgs,
	TagExistsInOrganizationArgs,
	TagsDiff,
	TagsInjectableDependencies,
	TagsRepository,
} from '../types/index.js'

export class TagsRepositoryImpl
	extends EntityRepository<Tag, string>
	implements TagsRepository
{
	constructor({ db }: TagsInjectableDependencies) {
		super({ db: db.client, table: tagTable })
	}

	async findAllByOrganization(organizationId: string): Promise<Tag[]> {
		return this.db
			.select()
			.from(tagTable)
			.where(eq(tagTable.organizationId, organizationId))
	}

	async findByOrganizationPaginated(
		args: FindTagsByOrganizationArgs,
	): Promise<Paginated<Tag>> {
		const { organizationId, pagination } = args
		const { cursor, limit } = pagination

		const conditions = new SqlExpressions(
			eq(tagTable.organizationId, organizationId),
		)

		if (cursor) {
			conditions.add(gt(tagTable.createdAt, new Date(cursor)))
		}

		const rows = await this.db
			.select()
			.from(tagTable)
			.where(and(...conditions.toArray()))
			.orderBy(desc(tagTable.createdAt))
			.limit(limit + 1)

		const { data, hasMore, nextCursor } = extractPaginationMetadata(rows, limit)

		return toPaginated({ data, hasMore, nextCursor })
	}

	async findAllByManuscript(manuscriptId: string): Promise<Tag[]> {
		return this.db
			.select(getTableColumns(tagTable))
			.from(manuscriptTagTable)
			.innerJoin(tagTable, eq(manuscriptTagTable.tagId, tagTable.id))
			.where(eq(manuscriptTagTable.manuscriptId, manuscriptId))
	}

	async getTagsDiff(
		manuscriptId: string,
		newTagIds: string[],
	): Promise<TagsDiff> {
		const existingTags = await this.findAllByManuscript(manuscriptId)

		const currentTagIds = existingTags.map((tag) => tag.id)

		const tagsToAdd = newTagIds.filter((id) => !currentTagIds.includes(id))
		const tagsToRemove = currentTagIds.filter((id) => !newTagIds.includes(id))

		return {
			tagsToAdd,
			tagsToRemove,
		}
	}

	async existsInOrganization({
		tagId,
		organizationId,
	}: TagExistsInOrganizationArgs): Promise<boolean> {
		const rows = await this.db.execute<{ exists: boolean }>(
			buildExistsQuery({
				table: tagTable,
				condition: and(
					eq(tagTable.id, tagId),
					eq(tagTable.organizationId, organizationId),
				) as SQL,
			}),
		)

		return rows.at(0)?.exists ?? false
	}

	async createOne(data: CreateTag): Promise<Result<Tag, HttpError>> {
		try {
			const rows = await this.db.insert(tagTable).values(data).returning()

			const tag = rows[0]

			return Ok(tag!)
		} catch (e: unknown) {
			if (
				e instanceof Error &&
				e.cause instanceof postgres.PostgresError &&
				e.cause.code === DUPLICATE_KEY_ERR_CODE
			) {
				return Err(new TagAlreadyExistsError(data.name))
			}

			return Err(new InternalServerError())
		}
	}

	async updateById(
		id: string,
		data: UpdateTag,
	): Promise<Result<None, HttpError>> {
		try {
			await this.db.update(tagTable).set(data).where(eq(tagTable.id, id))

			return Ok(None)
		} catch {
			return Err(new InternalServerError())
		}
	}
}
