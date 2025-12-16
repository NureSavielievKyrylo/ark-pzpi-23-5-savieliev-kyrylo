const PUBLICATION_TYPE = {
	BOOK: 'book',
	ARTICLE: 'article',
	CHAPTER: 'chapter',
	REPORT: 'report',
	THESIS: 'thesis',
	OTHER: 'other',
} as const

type PublicationType = (typeof PUBLICATION_TYPE)[keyof typeof PUBLICATION_TYPE]

const MANUSCRIPT_STATUS = {
	DRAFT: 'draft',
	IN_REVIEW: 'in_review',
	IN_EDITING: 'in_editing',
	PUBLISHED: 'published',
	REJECTED: 'rejected',
	NEEDS_REVISION: 'needs_revision',
} as const

type ManuscriptStatus =
	(typeof MANUSCRIPT_STATUS)[keyof typeof MANUSCRIPT_STATUS]

const DOCUMENT_MIME_TYPES = ['application/pdf', 'application/msword']

export { PUBLICATION_TYPE, MANUSCRIPT_STATUS, DOCUMENT_MIME_TYPES }
export type { PublicationType, ManuscriptStatus }
