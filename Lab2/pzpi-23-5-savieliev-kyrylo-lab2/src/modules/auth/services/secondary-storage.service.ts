import type { SecondaryStorage } from 'better-auth/db'
import type { AuthInjectableDependencies } from '../types/index.js'
import type { Redis } from 'ioredis'

export class SecondaryStorageImpl implements SecondaryStorage {
	private readonly redis: Redis

	constructor({ redis }: AuthInjectableDependencies) {
		this.redis = redis
	}

	async get(key: string) {
		return this.redis.get(key)
	}
	async set(
		key: string,
		value: string,
		ttl: number | undefined,
	): Promise<void> {
		const seconds = !ttl ? 0 : ttl * 1000

		if (ttl) {
			await this.redis.setex(key, seconds, value)
		} else {
			await this.redis.set(key, value)
		}
	}

	async delete(key: string): Promise<void> {
		await this.redis.del(key)
	}
}
