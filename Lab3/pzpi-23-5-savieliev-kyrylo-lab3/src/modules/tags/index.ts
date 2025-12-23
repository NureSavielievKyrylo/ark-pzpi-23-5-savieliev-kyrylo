import { asClass } from 'awilix'
import type { TagsDiConfig } from './types/index.js'
import { TagsRepositoryImpl } from './repositories/tag.repository.js'

export const resolveTagsModule = (): TagsDiConfig => ({
	tagsRepository: asClass(TagsRepositoryImpl).singleton(),
})
