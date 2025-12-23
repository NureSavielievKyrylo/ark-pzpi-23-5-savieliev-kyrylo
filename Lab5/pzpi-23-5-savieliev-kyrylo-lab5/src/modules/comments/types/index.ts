import type { Repository } from '@/core/types/common.js'
import type { BaseDiConfig, InjectableDependencies } from '@/core/types/deps.js'
import type { HttpError } from '@/core/utils/errors.js'
import type { Option, Result } from 'ts-results-es'
import type { UpdateComment } from '../schemas/index.js'
import type { RawComment } from '@/db/types.js'
import type { FindPaginatedArgs, Paginated } from '@/core/types/pagination.js'

type FindCommentsByManuscriptArgs = FindPaginatedArgs<{
	manuscriptId: string
}>

interface CreateCommentData {
	text: string
	manuscriptId: string
	authorId: string
	parentId?: string | null
}

interface CheckCommentOwnershipArgs {
	commentId: string
	memberId: string
}

interface CheckCommentInOrganizationArgs {
	commentId: string
	organizationId: string
}

type CommentAuthor = {
	id: string
	name: string
	email: string
	role: string
	image: string | null
}

type CommentWithAuthor = RawComment & {
	author: CommentAuthor
}

type Comment = CommentWithAuthor & {
	replies: Comment[]
}

type RawCommentWithAuthorJoin = RawComment & {
	author: {
		id: string
		role: string
		createdAt: Date
		organizationId: string
		userId: string
		userTable: {
			id: string
			name: string
			email: string
			image: string | null
		}
	}
}

interface CommentsRepository extends Repository<Comment, string> {
	findByManuscript: (
		args: FindCommentsByManuscriptArgs,
	) => Promise<Paginated<Comment>>
	findByIdWithAuthor: (id: string) => Promise<Option<Comment>>
	createOne: (data: CreateCommentData) => Promise<Result<Comment, HttpError>>
	updateById: (
		id: string,
		data: UpdateComment,
	) => Promise<Result<void, HttpError>>
	isCommentAuthor: (args: CheckCommentOwnershipArgs) => Promise<boolean>
	isCommentInOrganization: (
		args: CheckCommentInOrganizationArgs,
	) => Promise<boolean>
}

interface CommentsModuleDependencies {
	commentsRepository: CommentsRepository
}

type CommentsInjectableDependencies =
	InjectableDependencies<CommentsModuleDependencies>

type CommentsDiConfig = BaseDiConfig<CommentsModuleDependencies>

export type {
	CheckCommentInOrganizationArgs,
	CheckCommentOwnershipArgs,
	Comment,
	CommentsDiConfig,
	CommentsInjectableDependencies,
	CommentsModuleDependencies,
	CommentsRepository,
	CommentWithAuthor,
	CreateCommentData,
	FindCommentsByManuscriptArgs,
	RawCommentWithAuthorJoin,
	CommentAuthor,
}
