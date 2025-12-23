import type { ZodObject } from 'zod'
import { TagSchema } from '../schemas/index.js'

export const schemaWithTags = (schema: ZodObject) => {
	return schema.extend({
		tags: TagSchema.omit({ organizationId: true }).array(),
	})
}
