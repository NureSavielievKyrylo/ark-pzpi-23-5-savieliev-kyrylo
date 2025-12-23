import type { CommonDependencies, DatabaseClient } from '@/core/types/deps.js'
import { manuscriptTable } from '@/db/schema/manuscript.js'
import { publishingStageTable } from '@/db/schema/publishing-stage.js'
import { commentTable } from '@/db/schema/comment.js'
import { activityLogTable } from '@/db/schema/activity-log.js'
import { and, count, eq, isNotNull, sql } from 'drizzle-orm'

export class AnalyticsRepository {
	private readonly db: DatabaseClient

	constructor({ db }: CommonDependencies) {
		this.db = db.client
	}

	async getManuscriptStatusHistory(
		organizationId: string,
	): Promise<{ manuscriptId: string; status: string; changedAt: Date }[]> {
		const statusLogs = await this.db
			.select({
				manuscriptId:
					sql<string>`split_part(${activityLogTable.description}, ' ', 1)`.as(
						'manuscriptId',
					),
				status: sql<string>`${activityLogTable.description}`.as('status'),
				changedAt: activityLogTable.performedAt,
			})
			.from(activityLogTable)
			.where(
				and(
					eq(activityLogTable.entity, 'manuscript'),
					eq(activityLogTable.action, 'update'),
				),
			)
			.orderBy(activityLogTable.performedAt)

		if (!statusLogs.length) {
			const manuscripts = await this.db
				.select({
					manuscriptId: manuscriptTable.id,
					status: manuscriptTable.status,
					changedAt: manuscriptTable.createdAt,
				})
				.from(manuscriptTable)
				.where(eq(manuscriptTable.organizationId, organizationId))

			return manuscripts
		}

		return statusLogs
	}

	async getActivityCounts(
		organizationId: string,
		daysBack: number,
	): Promise<
		{
			manuscriptId: string
			manuscriptName: string
			activityCount: number
			daysObserved: number
		}[]
	> {
		const cutoffDate = new Date()
		cutoffDate.setDate(cutoffDate.getDate() - daysBack)

		const results = await this.db
			.select({
				manuscriptId: manuscriptTable.id,
				manuscriptName: manuscriptTable.name,
				activityCount: count(commentTable.id),
				createdAt: manuscriptTable.createdAt,
			})
			.from(manuscriptTable)
			.leftJoin(commentTable, eq(commentTable.manuscriptId, manuscriptTable.id))
			.where(eq(manuscriptTable.organizationId, organizationId))
			.groupBy(
				manuscriptTable.id,
				manuscriptTable.name,
				manuscriptTable.createdAt,
			)

		return results.map((r) => {
			const msDiff = Date.now() - r.createdAt.getTime()
			const daysElapsed = Math.ceil(msDiff / (1000 * 60 * 60 * 24))
			const manuscriptAge = Math.max(1, daysElapsed)
			return {
				manuscriptId: r.manuscriptId,
				manuscriptName: r.manuscriptName,
				activityCount: r.activityCount,
				daysObserved: Math.min(manuscriptAge, daysBack),
			}
		})
	}

	async getManuscriptsWithStages(organizationId: string): Promise<
		{
			manuscriptId: string
			manuscriptName: string
			deadline: Date | null
			status: string
			stages: {
				createdAt: Date
				finishedAt: Date | null
				deadlineAt: Date | null
			}[]
			commentCount: number
		}[]
	> {
		const manuscripts = await this.db
			.select({
				manuscriptId: manuscriptTable.id,
				manuscriptName: manuscriptTable.name,
				deadline: manuscriptTable.deadlineAt,
				status: manuscriptTable.status,
			})
			.from(manuscriptTable)
			.where(eq(manuscriptTable.organizationId, organizationId))

		const result = await Promise.all(
			manuscripts.map(async (m) => {
				const stages = await this.db
					.select({
						createdAt: publishingStageTable.createdAt,
						finishedAt: publishingStageTable.finishedAt,
						deadlineAt: publishingStageTable.deadlineAt,
					})
					.from(publishingStageTable)
					.where(eq(publishingStageTable.manuscriptId, m.manuscriptId))
					.orderBy(publishingStageTable.createdAt)

				const [commentResult] = await this.db
					.select({ count: count() })
					.from(commentTable)
					.where(eq(commentTable.manuscriptId, m.manuscriptId))

				return {
					...m,
					stages,
					commentCount: commentResult?.count ?? 0,
				}
			}),
		)

		return result
	}

	async getHistoricalStageDurations(
		organizationId: string,
	): Promise<{ stageName: string; durationDays: number }[]> {
		const stages = await this.db
			.select({
				stageName: publishingStageTable.name,
				createdAt: publishingStageTable.createdAt,
				finishedAt: publishingStageTable.finishedAt,
			})
			.from(publishingStageTable)
			.innerJoin(
				manuscriptTable,
				eq(publishingStageTable.manuscriptId, manuscriptTable.id),
			)
			.where(
				and(
					eq(manuscriptTable.organizationId, organizationId),
					isNotNull(publishingStageTable.finishedAt),
				),
			)

		return stages
			.filter((s) => s.finishedAt !== null)
			.map((s) => ({
				stageName: s.stageName,
				durationDays: Math.max(
					0.1,
					(s.finishedAt!.getTime() - s.createdAt.getTime()) /
						(1000 * 60 * 60 * 24),
				),
			}))
	}

	async getManuscriptStatuses(
		organizationId: string,
	): Promise<{ manuscriptId: string; status: string; createdAt: Date }[]> {
		return this.db
			.select({
				manuscriptId: manuscriptTable.id,
				status: manuscriptTable.status,
				createdAt: manuscriptTable.createdAt,
			})
			.from(manuscriptTable)
			.where(eq(manuscriptTable.organizationId, organizationId))
	}
}
