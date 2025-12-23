import { NotFoundError } from '../../../core/utils/errors.js'

export class PublishingStageNotFoundError extends NotFoundError {
	constructor(id: string) {
		super(`Publishing stage with id '${id}' not found`)
	}
}

export class ManuscriptNotFoundError extends NotFoundError {
	constructor(id: string) {
		super(`Manuscript with id '${id}' not found`)
	}
}
