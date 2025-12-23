export const slugify = (str: string): string => {
	return str.split(' ').filter(Boolean).join('-').toLowerCase()
}
