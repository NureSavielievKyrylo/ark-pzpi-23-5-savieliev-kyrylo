import { createAccessControl } from 'better-auth/plugins'

const statement = {
	manuscript: ['create', 'read', 'update', 'delete'],
	tag: ['create', 'read', 'update', 'delete'],
} as const

const ac = createAccessControl(statement)

const member = ac.newRole({
	manuscript: ['read', 'create', 'update'],
	tag: ['create', 'read', 'update', 'delete'],
})

const admin = ac.newRole({
	manuscript: ['read', 'create', 'update', 'delete'],
	tag: ['create', 'read', 'update', 'delete'],
})

const owner = ac.newRole({
	manuscript: ['read', 'create', 'update', 'delete'],
	tag: ['create', 'read', 'update', 'delete'],
})

export { ac, member, admin, owner }
