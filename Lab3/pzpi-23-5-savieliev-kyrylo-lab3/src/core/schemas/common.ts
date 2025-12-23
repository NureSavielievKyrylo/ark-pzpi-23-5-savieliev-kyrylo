import z from 'zod'

const HealthCheckSchema = z
	.object({
		uptime: z.number().positive().describe('Uptime in seconds'),
		message: z.string().describe('Health check message'),
		date: z.date().describe('Health check date'),
	})
	.describe('Health check response')

const HexSchema = z
	.custom<`#${string}`>((val) => {
		const regExp = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/

		return typeof val === 'string' && regExp.test(val)
	})
	.transform((val) => {
		if (val.length === 4) {
			return `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`.toUpperCase()
		}

		return val.toUpperCase()
	})
	.brand<'HexColor'>()

export { HealthCheckSchema, HexSchema }
