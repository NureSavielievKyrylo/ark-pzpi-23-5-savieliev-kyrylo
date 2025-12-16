import type {
	CommonDependencies,
	ExternalDependencies,
} from '@/core/types/deps.js'
import { resolveAuthModule } from '@/modules/auth/index.js'
import type { AuthModuleDependencies } from '@/modules/auth/types/index.js'
import { resolveCommentsModule } from '@/modules/comments/index.js'
import type { CommentsModuleDependencies } from '@/modules/comments/types/index.js'
import { resolveManuscriptsModule } from '@/modules/manuscripts/index.js'
import type { ManuscriptsModuleDependencies } from '@/modules/manuscripts/types/index.js'
import type { OrganizationsModuleDependencies } from '@/modules/organizations/types/index.js'
import { resolvePublishingStagesModule } from '@/modules/publishing-stages/index.js'
import type { PublishingStagesModuleDependencies } from '@/modules/publishing-stages/types/index.js'
import { resolveTagsModule } from '@/modules/tags/index.js'
import type { TagsModuleDependencies } from '@/modules/tags/types/index.js'
import type { AwilixContainer, NameAndRegistrationPair } from 'awilix'
import { resolveCommonDiConfig } from './common-di-config.js'
import { resolveOrganizationsModule } from '@/modules/organizations/index.js'

type Dependencies = CommonDependencies &
	AuthModuleDependencies &
	ManuscriptsModuleDependencies &
	TagsModuleDependencies &
	OrganizationsModuleDependencies &
	CommentsModuleDependencies &
	PublishingStagesModuleDependencies

type DiConfig = NameAndRegistrationPair<Dependencies>

export const registerDependencies = (
	diContainer: AwilixContainer,
	dependencies: ExternalDependencies,
) => {
	const diConfig: DiConfig = {
		...resolveCommonDiConfig(dependencies),
		...resolveAuthModule(),
		...resolveManuscriptsModule(),
		...resolveTagsModule(),
		...resolveOrganizationsModule(),
		...resolveCommentsModule(),
		...resolvePublishingStagesModule(),
	}

	diContainer.register(diConfig)
}

declare module '@fastify/awilix' {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface Cradle extends Dependencies {}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface RequestCradle extends Dependencies {}
}
