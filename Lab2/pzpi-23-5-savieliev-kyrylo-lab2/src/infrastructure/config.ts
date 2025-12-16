import type {
	Config,
	DbConfig,
	RedisConfig,
	S3Config,
} from '@/core/types/index.js'
import { env } from '@/env.js'

const getDbConfig = (): DbConfig => ({
	user: env.POSTGRES_USER,
	password: env.POSTGRES_PASSWORD,
	host: env.POSTGRES_HOST,
	port: env.POSTGRES_PORT,
	database: env.POSTGRES_DB,
})

const getRedisConfig = (): RedisConfig => ({
	host: env.REDIS_HOST,
	user: env.REDIS_USER,
	password: env.REDIS_PASSWORD,
	port: env.REDIS_PORT,
})

const getS3Config = (): S3Config => ({
	region: env.AWS_REGION,
	bucket: env.AWS_S3_BUCKET,
	accessKeyId: env.AWS_ACCESS_KEY_ID,
	secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
})

const getConfig = (): Config => ({
	db: getDbConfig(),
	redis: getRedisConfig(),
	s3: getS3Config(),
})

export { getConfig }
