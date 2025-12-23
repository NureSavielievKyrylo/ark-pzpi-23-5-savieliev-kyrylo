export const mean = (values: number[]): number => {
	if (values.length === 0) return 0
	return values.reduce((sum, v) => sum + v, 0) / values.length
}

export const stdDev = (values: number[]): number => {
	if (values.length < 2) return 0
	const avg = mean(values)
	const squareDiffs = values.map((v) => Math.pow(v - avg, 2))
	return Math.sqrt(mean(squareDiffs))
}

export const zScore = (value: number, mean: number, stdDev: number): number => {
	if (stdDev === 0) return 0
	return (value - mean) / stdDev
}

export const pValueFromZScore = (z: number): number => {
	const absZ = Math.abs(z)
	const t = 1 / (1 + 0.2316419 * absZ)
	const d = 0.3989423 * Math.exp((-absZ * absZ) / 2)
	const p =
		d *
		t *
		(0.3193815 +
			t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))

	return 2 * p
}

export const percentile = (sortedValues: number[], p: number): number => {
	if (sortedValues.length === 0) {
		return 0
	}

	const index = (p / 100) * (sortedValues.length - 1)
	const lower = Math.floor(index)
	const upper = Math.ceil(index)

	if (lower === upper) {
		return sortedValues[lower]!
	}

	const fraction = index - lower

	return sortedValues[lower]! * (1 - fraction) + sortedValues[upper]! * fraction
}

export const randomNormal = (mean: number, stdDev: number): number => {
	const u1 = Math.random()
	const u2 = Math.random()
	const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)

	return z0 * stdDev + mean
}

export const randomLogNormal = (mean: number, stdDev: number): number => {
	const variance = stdDev * stdDev
	const mu = Math.log((mean * mean) / Math.sqrt(variance + mean * mean))
	const sigma = Math.sqrt(Math.log(1 + variance / (mean * mean)))

	return Math.exp(randomNormal(mu, sigma))
}

export const steadyStateDistribution = (
	transitionMatrix: number[][],
	maxIterations = 1000,
	tolerance = 1e-10,
): number[] => {
	const n = transitionMatrix.length
	if (n === 0) return []

	let state = Array(n).fill(1 / n)

	for (let iter = 0; iter < maxIterations; iter++) {
		const newState = Array(n).fill(0)

		for (let j = 0; j < n; j++) {
			for (let i = 0; i < n; i++) {
				newState[j]! += state[i]! * transitionMatrix[i]![j]!
			}
		}

		const diff = state.reduce(
			(sum, v, i) => sum + Math.abs(v - newState[i]!),
			0,
		)
		if (diff < tolerance) {
			return newState
		}

		state = newState
	}

	return state
}

export const expectedHittingTimes = (
	transitionMatrix: number[][],
	targetStateIndex: number,
): number[] => {
	const n = transitionMatrix.length
	if (n === 0) return []

	const times: number[] = Array(n).fill(0)

	for (let start = 0; start < n; start++) {
		if (start === targetStateIndex) {
			times[start] = 0
			continue
		}

		const numSimulations = 10000
		let totalSteps = 0

		for (let sim = 0; sim < numSimulations; sim++) {
			let currentState = start
			let steps = 0
			const maxSteps = 1000

			while (currentState !== targetStateIndex && steps < maxSteps) {
				const rand = Math.random()
				let cumProb = 0

				for (let next = 0; next < n; next++) {
					cumProb += transitionMatrix[currentState]![next]!

					if (rand <= cumProb) {
						currentState = next
						break
					}
				}

				steps++
			}

			totalSteps += steps
		}

		times[start] = totalSteps / numSimulations
	}

	return times
}

export const betaMean = (alpha: number, beta: number): number => {
	return alpha / (alpha + beta)
}

export const betaConfidenceInterval = (
	alpha: number,
	beta: number,
): { lower: number; upper: number } => {
	const mean = betaMean(alpha, beta)
	const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
	const std = Math.sqrt(variance)
	const zValue = 1.96

	return {
		lower: Math.max(0, mean - zValue * std),
		upper: Math.min(1, mean + zValue * std),
	}
}
