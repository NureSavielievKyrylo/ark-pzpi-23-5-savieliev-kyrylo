import type { AppInstance } from '@/core/types/common.js'

export const registerAuthRoutes = async (app: AppInstance): Promise<void> => {
	app.route({
		method: ['GET', 'POST'],
		url: '/api/auth/*',
		async handler(request, reply) {
			try {
				const url = new URL(request.url, `http://${request.headers.host}`)

				const headers = new Headers()

				for (const [key, value] of Object.entries(request.headers)) {
					if (value) headers.append(key, value.toString())
				}

				const req = new Request(url.toString(), {
					method: request.method,
					headers,
					body: request.body ? JSON.stringify(request.body) : undefined,
				})

				const response = await this.diContainer.cradle.auth.handler(req)

				for (const [key, value] of response.headers.entries()) {
					reply.header(key, value)
				}

				reply.send(response.body ? await response.text() : null)
			} catch (e) {
				this.log.error(`Authentication Error: ${e}`)
			}
		},
	})
}
