import { EntityRepository } from '@/core/repositories/entity.repository.js'
import type {
	OrganizationsInjectableDependencies,
	OrganizationsRepository,
} from '../types/index.js'
import type { Organization } from '@/db/types.js'
import { organizationTable } from '@/db/schema/organization.js'

export class OrganizationsRepositoryImpl
	extends EntityRepository<Organization, string>
	implements OrganizationsRepository
{
	constructor({ db }: OrganizationsInjectableDependencies) {
		super({ db: db.client, table: organizationTable })
	}
}
