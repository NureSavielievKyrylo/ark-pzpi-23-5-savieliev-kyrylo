import { ConflictError, NotFoundError } from '@/core/utils/errors.js'

class TagNotFoundError extends NotFoundError {
	constructor(id: string) {
		super(`Tag with id '${id}' not found.`)
	}
}

class TagAlreadyExistsError extends ConflictError {
	constructor(name: string) {
		super(`Tag with the name '${name}' already exists.`)
	}
}

export { TagAlreadyExistsError, TagNotFoundError }
