const ENTITY = {
	MANUSCRIPT: 'manuscript',
	TAG: 'tag',
	USER: 'user',
	ORGANIZATION: 'organization',
	COMMENT: 'comment',
	PUBLISHING_STAGE: 'publishing_stage',
	FILE: 'file',
	BACKUP: 'backup',
} as const

type Entity = (typeof ENTITY)[keyof typeof ENTITY]

export { ENTITY }
export type { Entity }
