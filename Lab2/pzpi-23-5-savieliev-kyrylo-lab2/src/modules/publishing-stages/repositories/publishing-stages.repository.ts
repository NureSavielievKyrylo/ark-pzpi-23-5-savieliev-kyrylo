import { EntityRepository } from '@/core/repositories/entity.repository.js'
import { InternalServerError } from '@/core/utils/errors.js'
import { buildExistsQuery, SqlExpressions } from '@/core/utils/sql.js'
import { publishingStageTable } from '@/db/schema/publishing-stage.js'
import { manuscriptTable } from '@/db/schema/manuscript.js'
import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { Err, Ok, type Result } from 'ts-results-es'
import type { HttpError } from '@/core/utils/errors.js'
import type { PublishingStage } from '@/db/types.js'
import type { Paginated } from '@/core/types/pagination.js'
import { extractPaginationMetadata } from '@/core/utils/pagination.js'
import type {
	CheckStageInOrganizationArgs,
	CheckStageOwnershipArgs,
	CreatePublishingStageData,
	FindByManuscriptArgs,
	PublishingStagesRepository,
	PublishingStagesInjectableDependencies,
} from '../types/index.js'
import type { UpdatePublishingStage } from '../schemas/index.js'

export class PublishingStagesRepositoryImpl
	extends EntityRepository<PublishingStage, string>
	implements PublishingStagesRepository
{
	constructor({ db }: PublishingStagesInjectableDependencies) {
		super({ db: db.client, table: publishingStageTable })
	}

	async findByManuscriptPaginated(
		args: FindByManuscriptArgs,
	): Promise<Paginated<PublishingStage>> {
		const { manuscriptId, pagination } = args
		const { cursor, limit } = pagination

		const conditions = new SqlExpressions(
			eq(publishingStageTable.manuscriptId, manuscriptId),
		)

		if (cursor) {
			conditions.add(gt(publishingStageTable.createdAt, new Date(cursor)))
		}

		const rows = await this.db.query.publishingStageTable.findMany({
			where: and(...conditions.toArray()),
			orderBy: desc(publishingStageTable.createdAt),
			limit: limit + 1,
		})

		const { data, hasMore, nextCursor } = extractPaginationMetadata(rows, limit)

		return {
			data,
			meta: {
				nextCursor,
				hasMore,
			},
		}
	}

	async createOne(
		data: CreatePublishingStageData,
	): Promise<Result<PublishingStage, HttpError>> {
		try {
			const { deadlineAt, description, name, manuscriptId, createdBy } = data

			const rows = await this.db
				.insert(publishingStageTable)
				.values({
					name,
					description: description || null,
					deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
					manuscriptId,
					createdBy,
					createdAt: new Date(),
				})
				.returning()

			const stage = rows.at(0)

			return Ok(stage!)
		} catch {
			return Err(new InternalServerError())
		}
	}

	async updateById(
		id: string,
		data: UpdatePublishingStage,
	): Promise<Result<void, HttpError>> {
		try {
			const updateData: Record<string, unknown> = {}

			if (data.name !== undefined) {
				updateData.name = data.name
			}
			if (data.description !== undefined) {
				updateData.description = data.description || null
			}
			if (data.deadlineAt !== undefined) {
				updateData.deadlineAt = data.deadlineAt
					? new Date(data.deadlineAt)
					: null
			}
			if (data.finishedAt !== undefined) {
				updateData.finishedAt = data.finishedAt
					? new Date(data.finishedAt)
					: null
			}

			await this.db
				.update(publishingStageTable)
				.set(updateData)
				.where(eq(publishingStageTable.id, id))

			return Ok(undefined)
		} catch {
			return Err(new InternalServerError())
		}
	}

	async isStageCreator(args: CheckStageOwnershipArgs): Promise<boolean> {
		const { stageId, memberId } = args

		const rows = await this.db.execute<{ exists: boolean }>(
			buildExistsQuery({
				table: publishingStageTable,
				condition: and(
					eq(publishingStageTable.id, stageId),
					eq(publishingStageTable.createdBy, memberId),
				)!,
			}),
		)

		return rows.at(0)?.exists ?? false
	}

	async isStageInOrganization(
		args: CheckStageInOrganizationArgs,
	): Promise<boolean> {
		const { stageId, organizationId } = args

		const rows = await this.db.execute<{ exists: boolean }>(
			buildExistsQuery({
				table: publishingStageTable,
				condition: and(
					eq(publishingStageTable.id, stageId),
					sql`exists (
						select 1 from ${manuscriptTable}
						where ${manuscriptTable.id} = ${publishingStageTable.manuscriptId}
						and ${manuscriptTable.organizationId} = ${organizationId}
					)`,
				)!,
			}),
		)

		return rows.at(0)?.exists ?? false
	}
}
