import type { Repository } from '@/core/types/common.js'
import type { BaseDiConfig, InjectableDependencies } from '@/core/types/deps.js'
import type { HttpError } from '@/core/utils/errors.js'
import type {
	File,
	Manuscript,
	ManuscriptTag,
	RawManuscript,
	Tag,
} from '@/db/types.js'
import type { None, Option, Result } from 'ts-results-es'
import type { CreateManuscript, UpdateManuscript } from '../schemas/index.js'
import type { TagsDiff } from '@/modules/tags/types/index.js'
import type { FindPaginatedArgs, Paginated } from '@/core/types/pagination.js'

interface UploadFileArgs {
	fileBuffer: Buffer
	fileName: string
	mimeType: string
	uploadedBy: string
	manuscriptId: string
}

interface FindFileArgs {
	manuscriptId: string
	fileId: string
}

type RawManuscriptWithTagJoin = RawManuscript & {
	tags: (ManuscriptTag & { tag: Tag })[]
}

type UpdateManuscriptData = Omit<UpdateManuscript, 'tagIds'> & TagsDiff

type FindManuscriptsByOrganizationArgs = FindPaginatedArgs<{
	organizationId: string
}>

interface ManuscriptsRepository extends Repository<Manuscript, string> {
	findAllByOrganization: (organizationId: string) => Promise<Manuscript[]>
	findByOrganizationPaginated: (
		args: FindManuscriptsByOrganizationArgs,
	) => Promise<Paginated<Manuscript>>
	findFile: (args: FindFileArgs) => Promise<Option<File>>
	findFiles: (manuscriptId: string) => Promise<File[]>
	createOne: (data: CreateManuscript) => Promise<Result<Manuscript, HttpError>>
	updateById: (id: string, data: UpdateManuscriptData) => Promise<void>
}

interface FileUploadService {
	uploadFile: (args: UploadFileArgs) => Promise<Result<None, HttpError>>
	deleteFile: (fileName: string) => Promise<Result<None, HttpError>>
}

interface ManuscriptsModuleDependencies {
	manuscriptsRepository: ManuscriptsRepository
	fileUploadService: FileUploadService
}

type ManuscriptsInjectableDependencies =
	InjectableDependencies<ManuscriptsModuleDependencies>

type ManuscriptsDiConfig = BaseDiConfig<ManuscriptsModuleDependencies>

export type {
	FileUploadService,
	FindFileArgs,
	ManuscriptsDiConfig,
	ManuscriptsInjectableDependencies,
	ManuscriptsModuleDependencies,
	ManuscriptsRepository,
	RawManuscriptWithTagJoin,
	UpdateManuscriptData,
	UploadFileArgs,
	FindManuscriptsByOrganizationArgs,
}
