import { DUPLICATE_KEY_ERR_CODE } from '@/core/constants/db.js'
import { EntityRepository } from '@/core/repositories/entity.repository.js'
import type { Paginated } from '@/core/types/pagination.js'
import { InternalServerError, type HttpError } from '@/core/utils/errors.js'
import {
	extractPaginationMetadata,
	toPaginated,
} from '@/core/utils/pagination.js'
import { SqlExpressions } from '@/core/utils/sql.js'
import { fileTable } from '@/db/schema/file.js'
import { manuscriptTagTable } from '@/db/schema/manuscript-tag.js'
import { manuscriptTable } from '@/db/schema/manuscript.js'
import { tagTable } from '@/db/schema/tag.js'
import type { File, Manuscript, Tag } from '@/db/types.js'
import { and, desc, eq, getTableColumns, gt, inArray } from 'drizzle-orm'
import postgres from 'postgres'
import { Err, None, Ok, Option, Some, type Result } from 'ts-results-es'
import { ManuscriptAlreadyExistsError } from '../errors/index.js'
import type { CreateManuscript } from '../schemas/index.js'
import type {
	FindFileArgs,
	FindManuscriptsByOrganizationArgs,
	ManuscriptsInjectableDependencies,
	ManuscriptsRepository,
	UpdateManuscriptData,
} from '../types/index.js'
import { mapManuscriptWithTags } from '../utils/index.js'

export class ManuscriptsRepositoryImpl
	extends EntityRepository<Manuscript, string>
	implements ManuscriptsRepository
{
	constructor({ db }: ManuscriptsInjectableDependencies) {
		super({ db: db.client, table: manuscriptTable })
	}

	override async findAll(): Promise<Manuscript[]> {
		const rows = await this.db.query.manuscriptTable.findMany({
			with: {
				tags: {
					with: {
						tag: true,
					},
				},
			},
		})

		const manuscripts = rows.map(mapManuscriptWithTags)

		return manuscripts
	}

	async findAllByOrganization(organizationId: string): Promise<Manuscript[]> {
		const rows = await this.db.query.manuscriptTable.findMany({
			where: eq(manuscriptTable.organizationId, organizationId),
			with: {
				tags: {
					with: {
						tag: true,
					},
				},
			},
		})

		const manuscripts = rows.map(mapManuscriptWithTags)

		return manuscripts
	}

	async findByOrganizationPaginated(
		args: FindManuscriptsByOrganizationArgs,
	): Promise<Paginated<Manuscript>> {
		const { organizationId, pagination } = args
		const { cursor, limit } = pagination

		const conditions = new SqlExpressions(
			eq(manuscriptTable.organizationId, organizationId),
		)

		if (cursor) {
			conditions.add(gt(manuscriptTable.createdAt, new Date(cursor)))
		}

		const rows = await this.db.query.manuscriptTable.findMany({
			where: and(...conditions.toArray()),
			with: {
				tags: {
					with: {
						tag: true,
					},
				},
			},
			orderBy: desc(manuscriptTable.createdAt),
			limit: limit + 1,
		})

		const { data, hasMore, nextCursor } = extractPaginationMetadata(rows, limit)

		const manuscripts = data.map(mapManuscriptWithTags)

		return toPaginated({ data: manuscripts, hasMore, nextCursor })
	}

	override async findById(id: string): Promise<Option<Manuscript>> {
		const rows = await this.db.query.manuscriptTable.findMany({
			where: eq(manuscriptTable.id, id),
			with: {
				tags: {
					with: {
						tag: true,
					},
				},
			},
		})

		const manuscript = rows.map(mapManuscriptWithTags).at(0)

		return manuscript ? Some(manuscript) : None
	}

	async findManuscriptTags(manuscriptId: string): Promise<Tag[]> {
		return this.db
			.select(getTableColumns(tagTable))
			.from(manuscriptTagTable)
			.innerJoin(tagTable, eq(manuscriptTagTable.tagId, tagTable.id))
			.where(eq(manuscriptTagTable.manuscriptId, manuscriptId))
	}

	async findFile({
		fileId,
		manuscriptId,
	}: FindFileArgs): Promise<Option<File>> {
		const rows = await this.db
			.select()
			.from(fileTable)
			.where(
				and(eq(fileTable.id, fileId), eq(fileTable.manuscriptId, manuscriptId)),
			)

		const file = rows.at(0)

		return file ? Some(file) : None
	}

	async findFiles(manuscriptId: string): Promise<File[]> {
		return this.db
			.select()
			.from(fileTable)
			.where(eq(fileTable.manuscriptId, manuscriptId))
	}

	async createOne(
		data: CreateManuscript,
	): Promise<Result<Manuscript, HttpError>> {
		try {
			const { tagIds, ...rest } = data

			const manuscript = await this.db.transaction(async (tx) => {
				const rows = await tx.insert(manuscriptTable).values(rest).returning()

				const manuscript = rows.at(0) as Manuscript

				if (tagIds.length) {
					const tagInserts = tagIds.map((tagId) => ({
						manuscriptId: manuscript.id,
						tagId,
					}))

					await tx.insert(manuscriptTagTable).values(tagInserts)
				}

				return manuscript
			})

			return Ok(manuscript)
		} catch (error: unknown) {
			if (
				error instanceof Error &&
				error.cause instanceof postgres.PostgresError &&
				error.cause.code === DUPLICATE_KEY_ERR_CODE
			) {
				return Err(new ManuscriptAlreadyExistsError(data.name))
			}

			return Err(new InternalServerError())
		}
	}

	async updateById(id: string, data: UpdateManuscriptData): Promise<void> {
		const { tagsToAdd, tagsToRemove, ...rest } = data

		await this.db.transaction(async (tx) => {
			if (tagsToAdd.length) {
				const tagInserts = tagsToAdd.map((tagId) => ({
					manuscriptId: id,
					tagId,
				}))

				await tx.insert(manuscriptTagTable).values(tagInserts)
			}

			if (tagsToRemove.length) {
				await tx
					.delete(manuscriptTagTable)
					.where(
						and(
							eq(manuscriptTagTable.manuscriptId, id),
							inArray(manuscriptTagTable.tagId, tagsToRemove),
						),
					)
			}

			await tx
				.update(manuscriptTable)
				.set(rest)
				.where(eq(manuscriptTable.id, id))
		})
	}
}
