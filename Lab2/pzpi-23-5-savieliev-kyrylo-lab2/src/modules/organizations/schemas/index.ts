import z from 'zod'

const OrganizationSchema = z.object({
	id: z.uuidv7().describe('The unique identifier of the organization'),
	createdAt: z.coerce
		.date()
		.describe('The ISO 8601 date string when the organization was created'),
	name: z.string().min(1).max(255).describe('The name of the organization'),
	slug: z
		.string()
		.min(1)
		.max(255)
		.describe('The URL-friendly unique slug of the organization'),
	logo: z
		.string()
		.url()
		.optional()
		.describe('The URL of the organization logo'),
	metadata: z
		.string()
		.optional()
		.describe('Additional metadata for the organization'),
})

const GetOrganizationSchema = z.object({
	id: z.uuidv7().describe('The unique identifier of the organization'),
})

type GetOrganization = z.infer<typeof GetOrganizationSchema>

export { GetOrganizationSchema, OrganizationSchema }
export type { GetOrganization }
