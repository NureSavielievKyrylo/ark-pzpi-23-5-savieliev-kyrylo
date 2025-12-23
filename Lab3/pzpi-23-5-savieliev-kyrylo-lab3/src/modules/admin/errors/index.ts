import { HttpError } from '@/core/utils/errors.js'

export class BackupError extends HttpError {
	constructor(message: string) {
		super(500, message)
		this.name = 'BACKUP_ERROR'
	}
}

export class BackupUploadError extends HttpError {
	constructor() {
		super(500, 'Failed to upload backup to S3')
		this.name = 'BACKUP_UPLOAD_ERROR'
	}
}

export class PgDumpError extends HttpError {
	constructor(details?: string) {
		super(500, `Database dump failed${details ? `: ${details}` : ''}`)
		this.name = 'PG_DUMP_ERROR'
	}
}

export class BackupNotFoundError extends HttpError {
	constructor() {
		super(404, 'Backup not found')
		this.name = 'BACKUP_NOT_FOUND_ERROR'
	}
}

export class BackupDownloadError extends HttpError {
	constructor() {
		super(500, 'Failed to download backup from S3')
		this.name = 'BACKUP_DOWNLOAD_ERROR'
	}
}

export class PgRestoreError extends HttpError {
	constructor(details?: string) {
		super(500, `Database restore failed${details ? `: ${details}` : ''}`)
		this.name = 'PG_RESTORE_ERROR'
	}
}
