import { asClass } from 'awilix'
import type { CommentsDiConfig } from './types/index.js'
import { CommentsRepositoryImpl } from './repositories/comments.repository.js'

export const resolveCommentsModule = (): CommentsDiConfig => ({
	commentsRepository: asClass(CommentsRepositoryImpl).singleton(),
})
