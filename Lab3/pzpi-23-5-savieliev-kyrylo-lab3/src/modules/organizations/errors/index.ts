import { HttpError } from '@/core/utils/errors.js'

export class OrganizationNotFoundError extends HttpError {
	constructor(organizationId: string) {
		super(404, `Organization with id '${organizationId}' not found.`)
	}
}
