import { EntityRepository } from '@/core/repositories/entity.repository.js'
import { InternalServerError } from '@/core/utils/errors.js'
import { buildExistsQuery, SqlExpressions } from '@/core/utils/sql.js'
import { commentTable } from '@/db/schema/comment.js'
import { manuscriptTable } from '@/db/schema/manuscript.js'
import { and, asc, desc, eq, gt, isNull, sql } from 'drizzle-orm'
import { Err, None, Ok, Some, type Option, type Result } from 'ts-results-es'
import type { HttpError } from '@/core/utils/errors.js'
import type {
	CheckCommentInOrganizationArgs,
	CheckCommentOwnershipArgs,
	CommentsInjectableDependencies,
	CommentsRepository,
	CreateCommentData,
	FindCommentsByManuscriptArgs,
	RawCommentWithAuthorJoin,
	Comment,
} from '../types/index.js'
import type { UpdateComment } from '../schemas/index.js'
import { mapCommentAuthor } from '../utils/index.js'
import type { Paginated } from '@/core/types/pagination.js'
import { extractPaginationMetadata } from '@/core/utils/pagination.js'

export class CommentsRepositoryImpl
	extends EntityRepository<Comment, string>
	implements CommentsRepository
{
	constructor({ db }: CommentsInjectableDependencies) {
		super({ db: db.client, table: commentTable })
	}

	async findByManuscript(
		args: FindCommentsByManuscriptArgs,
	): Promise<Paginated<Comment>> {
		const { manuscriptId, pagination } = args
		const { cursor, limit } = pagination

		const conditions = new SqlExpressions(
			eq(commentTable.manuscriptId, manuscriptId),
			isNull(commentTable.parentId),
		)

		if (cursor) {
			conditions.add(gt(commentTable.createdAt, new Date(cursor)))
		}

		const rows = await this.db.query.commentTable.findMany({
			where: and(...conditions.toArray()),
			with: {
				author: {
					with: {
						userTable: true,
					},
				},
			},
			orderBy: desc(commentTable.createdAt),
			limit: limit + 1,
		})

		const { data, hasMore, nextCursor } = extractPaginationMetadata(rows, limit)

		const comments = await Promise.all(
			data.map((row) => this.buildCommentTree(row)),
		)

		return {
			data: comments,
			meta: {
				nextCursor,
				hasMore,
			},
		}
	}

	private async buildCommentTree(
		rawComment: RawCommentWithAuthorJoin,
	): Promise<Comment> {
		const author = mapCommentAuthor(rawComment.author)

		const replyRows = await this.db.query.commentTable.findMany({
			where: eq(commentTable.parentId, rawComment.id),
			with: {
				author: {
					with: {
						userTable: true,
					},
				},
			},
			orderBy: asc(commentTable.createdAt),
		})

		const replies = await Promise.all(
			replyRows.map((reply) => this.buildCommentTree(reply)),
		)

		return {
			id: rawComment.id,
			text: rawComment.text,
			createdAt: rawComment.createdAt,
			updatedAt: rawComment.updatedAt,
			manuscriptId: rawComment.manuscriptId,
			authorId: rawComment.authorId,
			parentId: rawComment.parentId,
			author,
			replies,
		}
	}

	async findByIdWithAuthor(id: string): Promise<Option<Comment>> {
		const rows = await this.db.query.commentTable.findMany({
			where: eq(commentTable.id, id),
			with: {
				author: {
					with: {
						userTable: true,
					},
				},
			},
			limit: 1,
		})

		const row = rows.at(0)

		if (!row) {
			return None
		}

		const comment = await this.buildCommentTree(row)

		return Some(comment)
	}

	async createOne(
		data: CreateCommentData,
	): Promise<Result<Comment, HttpError>> {
		try {
			const rows = await this.db.insert(commentTable).values(data).returning()

			const rawComment = rows.at(0)!

			const commentOption = await this.findByIdWithAuthor(rawComment.id)

			return commentOption.toResult(new InternalServerError())
		} catch {
			return Err(new InternalServerError())
		}
	}

	async updateById(
		id: string,
		data: UpdateComment,
	): Promise<Result<void, HttpError>> {
		try {
			await this.db
				.update(commentTable)
				.set({ text: data.text, updatedAt: new Date() })
				.where(eq(commentTable.id, id))

			return Ok(undefined)
		} catch {
			return Err(new InternalServerError())
		}
	}

	async isCommentAuthor(args: CheckCommentOwnershipArgs): Promise<boolean> {
		const { commentId, memberId } = args

		const rows = await this.db.execute<{ exists: boolean }>(
			buildExistsQuery({
				table: commentTable,
				condition: and(
					eq(commentTable.id, commentId),
					eq(commentTable.authorId, memberId),
				)!,
			}),
		)

		return rows.at(0)?.exists ?? false
	}

	async isCommentInOrganization(
		args: CheckCommentInOrganizationArgs,
	): Promise<boolean> {
		const { commentId, organizationId } = args

		const rows = await this.db.execute<{ exists: boolean }>(
			buildExistsQuery({
				table: commentTable,
				condition: and(
					eq(commentTable.id, commentId),
					sql`exists (
						select 1 from ${manuscriptTable}
						where ${manuscriptTable.id} = ${commentTable.manuscriptId}
						and ${manuscriptTable.organizationId} = ${organizationId}
					)`,
				)!,
			}),
		)

		return rows.at(0)?.exists ?? false
	}
}
