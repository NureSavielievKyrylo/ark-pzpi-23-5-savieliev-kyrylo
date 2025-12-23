interface DbConfig {
	user: string
	password: string
	host: string
	port: number
	database: string
}

interface RedisConfig {
	user: string
	host: string
	port: number
	password: string
}

interface S3Config {
	region: string
	bucket: string
	accessKeyId: string
	secretAccessKey: string
}

interface Config {
	db: DbConfig
	redis: RedisConfig
	s3: S3Config
}

export type { Config, DbConfig, RedisConfig, S3Config }
