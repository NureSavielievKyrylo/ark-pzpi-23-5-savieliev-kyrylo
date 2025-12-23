import { z } from 'zod'

const envSchema = z.object({
	PORT: z.coerce.number().min(1000),
	ALLOWED_ORIGINS: z
		.string()
		.transform((val) => val.split(',').map((origin) => origin.trim())),
	POSTGRES_HOST: z.string(),
	POSTGRES_DB: z.string(),
	POSTGRES_USER: z.string(),
	POSTGRES_PASSWORD: z.string(),
	POSTGRES_PORT: z.coerce.number().default(5432),
	COOKIE_SECRET: z.string(),
	REDIS_HOST: z.string(),
	REDIS_USER: z.string(),
	REDIS_PASSWORD: z.string(),
	REDIS_PORT: z.coerce.number().default(6379),
	AWS_REGION: z.string(),
	AWS_S3_BUCKET: z.string(),
	AWS_ACCESS_KEY_ID: z.string(),
	AWS_SECRET_ACCESS_KEY: z.string(),
})

const env = envSchema.parse(process.env)

export { env }
