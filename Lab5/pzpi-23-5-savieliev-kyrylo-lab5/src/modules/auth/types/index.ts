import type { BaseDiConfig, InjectableDependencies } from '@/core/types/deps.js'
import type { SecondaryStorage } from 'better-auth/db'
import type { initBetterAuth } from '../utils/index.js'

type AuthClient = ReturnType<typeof initBetterAuth>

interface VerifyPasswordArgs {
	hash: string
	password: string
}

interface PasswordService {
	hash: (password: string) => Promise<string>
	verify: (data: VerifyPasswordArgs) => Promise<boolean>
}
interface AuthModuleDependencies {
	auth: AuthClient
	passwordService: PasswordService
	secondaryStorage: SecondaryStorage
}

type AuthInjectableDependencies = InjectableDependencies<AuthModuleDependencies>

type AuthDiModule = BaseDiConfig<AuthModuleDependencies>

export type {
	AuthClient,
	AuthDiModule,
	AuthInjectableDependencies,
	AuthModuleDependencies,
	PasswordService,
	VerifyPasswordArgs,
}
