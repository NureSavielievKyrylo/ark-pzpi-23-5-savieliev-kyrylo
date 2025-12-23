const ACTIVITY_ACTION = {
	INSERT: 'insert',
	UPDATE: 'update',
	DELETE: 'delete',
	UPLOAD: 'upload',
} as const

const LOG_SEVERITY = {
	INFO: 'info',
	WARNING: 'warning',
	ERROR: 'error',
} as const

type ActivityAction = (typeof ACTIVITY_ACTION)[keyof typeof ACTIVITY_ACTION]
type LogSeverity = (typeof LOG_SEVERITY)[keyof typeof LOG_SEVERITY]

export type { ActivityAction, LogSeverity }
export { ACTIVITY_ACTION, LOG_SEVERITY }
