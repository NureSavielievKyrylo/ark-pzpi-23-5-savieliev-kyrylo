import type { FastifyInstance } from 'fastify'
import type http from 'node:http'
import { Option } from 'ts-results-es'

type AppInstance = FastifyInstance<
	http.Server,
	http.IncomingMessage,
	http.ServerResponse
>

interface Repository<T, ID> {
	findById: (id: ID) => Promise<Option<T>>
	existsById: (id: ID) => Promise<boolean>
	findAll: () => Promise<T[]>
	deleteById: (id: ID) => Promise<void>
}

interface HttpError {
	status: number
	error: string
	message: string
}

interface ValidationError {
	status: number
	error: string
	message: string
	details: {
		issues: unknown[]
		method: string
		url: string
	}
}

interface SuccessResponse<T> {
	success: true
	data: T
	message?: string
	error: null
}

type FailureResponse = HttpError | ValidationError

type BaseResponse<T> = SuccessResponse<T> | FailureResponse

export type {
	AppInstance,
	BaseResponse,
	FailureResponse,
	ValidationError,
	SuccessResponse,
	Repository,
}
