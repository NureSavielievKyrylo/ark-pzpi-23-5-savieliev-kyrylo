import { NotFoundError } from '@/core/utils/errors.js'

export class CommentNotFoundError extends NotFoundError {
	constructor(id: string) {
		super(`Comment with id '${id}' not found`)
	}
}

export class ParentCommentNotFoundError extends NotFoundError {
	constructor(id: string) {
		super(`Parent comment with id '${id}' not found`)
	}
}
