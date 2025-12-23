import type { Repository } from '@/core/types/common.js'
import type { BaseDiConfig, InjectableDependencies } from '@/core/types/deps.js'
import type { Organization } from '@/db/types.js'

type OrganizationsRepository = Repository<Organization, string>

interface OrganizationsModuleDependencies {
	organizationsRepository: OrganizationsRepository
}

type OrganizationsInjectableDependencies =
	InjectableDependencies<OrganizationsModuleDependencies>

type OrganizationsDiConfig = BaseDiConfig<OrganizationsModuleDependencies>

export type {
	OrganizationsRepository,
	OrganizationsModuleDependencies,
	OrganizationsInjectableDependencies,
	OrganizationsDiConfig,
}
