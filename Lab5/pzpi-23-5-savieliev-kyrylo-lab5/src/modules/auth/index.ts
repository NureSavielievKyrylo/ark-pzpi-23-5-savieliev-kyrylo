import { asClass, asFunction } from 'awilix'
import { PasswordServiceImpl } from './services/password.service.js'
import { SecondaryStorageImpl } from './services/secondary-storage.service.js'
import type { AuthDiModule, AuthInjectableDependencies } from './types/index.js'
import { initBetterAuth } from './utils/index.js'

export const resolveAuthModule = (): AuthDiModule => ({
	passwordService: asClass(PasswordServiceImpl).singleton(),
	secondaryStorage: asClass(SecondaryStorageImpl).singleton(),
	auth: asFunction((deps: AuthInjectableDependencies) =>
		initBetterAuth(deps),
	).singleton(),
})
