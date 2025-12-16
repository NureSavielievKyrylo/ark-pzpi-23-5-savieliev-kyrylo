import * as schema from '@/db/schema/index.js'
import { betterAuth, nodeENV } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import {
	admin,
	createAuthMiddleware,
	haveIBeenPwned,
	lastLoginMethod,
	multiSession,
	openAPI,
	organization,
	username,
} from 'better-auth/plugins'
import type { AuthInjectableDependencies } from '../types/index.js'
import {
	ac,
	admin as adminRole,
	member,
	owner,
} from '@/core/permissions/org.permissions.js'

export const initBetterAuth = (deps: AuthInjectableDependencies) => {
	const { db, secondaryStorage, passwordService } = deps

	return betterAuth({
		database: drizzleAdapter(db.client, {
			provider: 'pg',
			schema,
		}),
		secondaryStorage,
		user: {
			modelName: 'userTable',
			additionalFields: {
				locale: {
					type: 'string',
					required: false,
					defaultValue: 'en',
				},
			},
		},
		account: {
			modelName: 'accountTable',
		},
		session: {
			modelName: 'sessionTable',
		},
		verification: {
			modelName: 'verificationTokenTable',
		},
		emailAndPassword: {
			enabled: true,
			password: passwordService,
		},
		advanced: {
			useSecureCookies: nodeENV === 'production',
			cookiePrefix: 'inkly',
			cookies: {
				session_token: {
					name: 'inkly_session_token',
				},
			},
			database: {
				generateId: 'uuid',
			},
			disableOriginCheck: nodeENV !== 'production',
		},
		plugins: [
			username(),
			admin(),
			multiSession(),
			lastLoginMethod({
				cookieName: 'inkly.last_used_login_method',
				storeInDatabase: true,
			}),
			haveIBeenPwned({
				customPasswordCompromisedMessage:
					'Please choose a more secure password',
			}),
			organization({
				ac,
				roles: {
					owner,
					admin: adminRole,
					member,
				},
				schema: {
					organization: { modelName: 'organizationTable' },
					member: { modelName: 'memberTable' },
					invitation: { modelName: 'invitationTable' },
				},
			}),
			openAPI({ disableDefaultReference: true }),
		],
		hooks: {
			after: createAuthMiddleware(async (ctx) => {
				if (ctx.path.startsWith('/sign-up')) {
					const createdUser = ctx.context.newSession

					const userCount = await ctx.context.adapter.count({
						model: 'userTable',
					})

					if (userCount === 1 && createdUser) {
						await ctx.context.adapter.update({
							model: 'userTable',
							where: [{ value: createdUser.user.id, field: 'id' }],
							update: { role: 'admin' },
						})

						return ctx.json({
							// @ts-expect-error assume that token exists here
							token: ctx.context.returned?.token,
							user: {
								// @ts-expect-error assume that user exists here
								...ctx.context.returned?.user,
								role: 'admin',
							},
						})
					}
				}
			}),
		},
		experimental: {
			joins: true,
		},
	})
}
