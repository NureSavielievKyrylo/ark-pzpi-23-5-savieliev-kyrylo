import type { PasswordService, VerifyPasswordArgs } from '../types/index.js'
import { hash, verify } from '@node-rs/argon2'

export class PasswordServiceImpl implements PasswordService {
	private static readonly HASHING_PARAMS = {
		memoryCost: 19_456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	} as const

	async generateHash(password: string): Promise<string> {
		return hash(password, PasswordServiceImpl.HASHING_PARAMS)
	}

	async verify({ hash, password }: VerifyPasswordArgs): Promise<boolean> {
		return verify(hash, password, PasswordServiceImpl.HASHING_PARAMS)
	}
}
