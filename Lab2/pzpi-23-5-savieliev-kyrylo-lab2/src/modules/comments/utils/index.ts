import type { CommentAuthor, RawCommentWithAuthorJoin } from '../types/index.js'

export const mapCommentAuthor = (
	member: RawCommentWithAuthorJoin['author'],
): CommentAuthor => {
	return {
		id: member.id,
		name: member.userTable.name,
		email: member.userTable.email,
		role: member.role,
		image: member.userTable.image,
	}
}
