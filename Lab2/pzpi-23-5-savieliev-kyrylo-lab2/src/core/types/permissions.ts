type Permission = 'read' | 'create' | 'update' | 'delete'

type PermissionEntity = 'manuscript' | 'tag'

type PermissionsRecord = Record<PermissionEntity, Permission[]>

export type { PermissionsRecord, Permission }
