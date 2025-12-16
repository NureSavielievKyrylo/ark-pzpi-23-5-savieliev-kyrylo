import type { PaginationMeta, PaginationQuery } from '../schemas/pagination.js'
interface Paginated<T extends object> {
	data: T[]
	meta: PaginationMeta
}

interface ExtractedPaginationMetadata<T extends object> extends PaginationMeta {
	data: T[]
}

type FindPaginatedArgs<T extends object> = T & {
	pagination: PaginationQuery
}

export type { ExtractedPaginationMetadata, FindPaginatedArgs, Paginated }
