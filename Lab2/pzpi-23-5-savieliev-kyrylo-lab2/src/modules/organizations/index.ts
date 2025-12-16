import { asClass } from 'awilix'
import type { OrganizationsDiConfig } from './types/index.js'
import { OrganizationsRepositoryImpl } from './repositories/organization.repository.js'

export const resolveOrganizationsModule = (): OrganizationsDiConfig => ({
	organizationsRepository: asClass(OrganizationsRepositoryImpl).singleton(),
})
