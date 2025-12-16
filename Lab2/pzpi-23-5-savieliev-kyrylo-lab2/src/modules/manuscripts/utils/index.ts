import type { Manuscript } from '@/db/types.js'
import type { RawManuscriptWithTagJoin } from '../types/index.js'

export const mapManuscriptWithTags = (
	manuscript: RawManuscriptWithTagJoin,
): Manuscript => {
	const { tags, ...rest } = manuscript

	return {
		...rest,
		tags: tags.map((mt) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { organizationId, ...rest } = mt.tag

			return { ...rest }
		}),
	}
}
