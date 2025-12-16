import type {
	ExtractedPaginationMetadata,
	Paginated,
} from '../types/pagination.js'

const extractPaginationMetadata = <T extends object & { createdAt: Date }>(
	rows: T[],
	limit: number,
): ExtractedPaginationMetadata<T> => {
	const hasMore = rows.length > limit
	const data = hasMore ? rows.slice(0, limit) : rows
	const nextCursor =
		hasMore && data.length > 0 ? data.at(-1)!.createdAt.toISOString() : null

	return { data, hasMore, nextCursor }
}

const toPaginated = <T extends object>(
	metadata: ExtractedPaginationMetadata<T>,
): Paginated<T> => {
	const { data, hasMore, nextCursor } = metadata

	return {
		data: data,
		meta: {
			nextCursor,
			hasMore,
		},
	}
}

export { extractPaginationMetadata, toPaginated }
