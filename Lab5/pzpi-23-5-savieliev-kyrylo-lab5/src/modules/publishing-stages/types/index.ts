import type { Repository } from '@/core/types/common.js'
import type { BaseDiConfig, InjectableDependencies } from '@/core/types/deps.js'
import type { FindPaginatedArgs, Paginated } from '@/core/types/pagination.js'
import type { HttpError } from '@/core/utils/errors.js'
import type { PublishingStage } from '@/db/types.js'
import type { Result } from 'ts-results-es'
import type {
	CreatePublishingStage,
	UpdatePublishingStage,
} from '../schemas/index.js'

type FindByManuscriptArgs = FindPaginatedArgs<{
	manuscriptId: string
}>

interface CreatePublishingStageData extends CreatePublishingStage {
	manuscriptId: string
	createdBy: string
	createdAt?: Date
}

interface CheckStageOwnershipArgs {
	stageId: string
	memberId: string
}

interface CheckStageInOrganizationArgs {
	stageId: string
	organizationId: string
}

interface PublishingStagesRepository
	extends Repository<PublishingStage, string> {
	findByManuscriptPaginated: (
		args: FindByManuscriptArgs,
	) => Promise<Paginated<PublishingStage>>
	createOne: (
		data: CreatePublishingStageData,
	) => Promise<Result<PublishingStage, HttpError>>
	updateById: (
		id: string,
		data: UpdatePublishingStage,
	) => Promise<Result<void, HttpError>>
	isStageCreator: (args: CheckStageOwnershipArgs) => Promise<boolean>
	isStageInOrganization: (
		args: CheckStageInOrganizationArgs,
	) => Promise<boolean>
}

interface PublishingStagesModuleDependencies {
	publishingStagesRepository: PublishingStagesRepository
}

type PublishingStagesInjectableDependencies =
	InjectableDependencies<PublishingStagesModuleDependencies>

type PublishingStagesDiConfig = BaseDiConfig<PublishingStagesModuleDependencies>

export type {
	CheckStageInOrganizationArgs,
	CheckStageOwnershipArgs,
	CreatePublishingStageData,
	FindByManuscriptArgs,
	PublishingStagesDiConfig,
	PublishingStagesInjectableDependencies,
	PublishingStagesModuleDependencies,
	PublishingStagesRepository,
}
