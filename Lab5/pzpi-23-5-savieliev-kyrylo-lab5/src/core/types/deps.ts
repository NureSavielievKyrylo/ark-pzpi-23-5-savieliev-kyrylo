import type postgres from 'postgres'
import type { Resolver } from 'awilix'
import type { FastifyBaseLogger } from 'fastify'
import type { Config } from './config.js'
import type { AppInstance } from './common.js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { Redis } from 'ioredis'
import * as schema from '@/db/schema/index.js'
import type { S3Client } from '@aws-sdk/client-s3'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseDiConfig<T> = Record<keyof T, Resolver<any>>

type DatabaseClient = PostgresJsDatabase<typeof schema>
interface CommonDependencies {
	config: Config
	db: {
		connection: postgres.Sql
		client: DatabaseClient
	}
	redis: Redis
	s3: S3Client
	logger: FastifyBaseLogger
}

type InjectableDependencies<T> = T & CommonDependencies

interface ExternalDependencies {
	app: AppInstance
}

export type {
	BaseDiConfig,
	CommonDependencies,
	InjectableDependencies,
	ExternalDependencies,
	DatabaseClient,
}
