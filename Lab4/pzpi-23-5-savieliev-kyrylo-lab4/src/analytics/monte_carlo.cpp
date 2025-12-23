#include "monte_carlo.h"
#include "math_utils.h"
#include <string.h>

MonteCarloSimulator::MonteCarloSimulator()
    : numSimulations(NUM_SIMULATIONS)
{
}

void MonteCarloSimulator::setSimulationCount(int count)
{
    numSimulations = min(count, NUM_SIMULATIONS);
}

SimulationResult MonteCarloSimulator::simulate(
    const char *manuscriptId,
    int remainingStages,
    float meanStageDuration,
    float stdDevStageDuration,
    float daysUntilDeadline)
{
    SimulationResult result;

    strncpy(result.manuscriptId, manuscriptId, sizeof(result.manuscriptId) - 1);
    result.manuscriptId[sizeof(result.manuscriptId) - 1] = '\0';

    result.simulationsRun = numSimulations;

    if (remainingStages <= 0)
    {
        result.p50CompletionDays = 0.0f;
        result.p90CompletionDays = 0.0f;
        result.probabilityByDeadline = 1.0f;
        return result;
    }

    if (meanStageDuration <= 0)
    {
        meanStageDuration = 7.0f;
    }
    if (stdDevStageDuration <= 0)
    {
        stdDevStageDuration = meanStageDuration * 0.5f;
    }

    int completedOnTime = 0;

    for (int i = 0; i < numSimulations; i++)
    {
        results[i] = runSingleSimulation(
            remainingStages,
            meanStageDuration,
            stdDevStageDuration);

        if (results[i] <= daysUntilDeadline)
        {
            completedOnTime++;
        }
    }

    Analytics::quickSort(results, 0, numSimulations - 1);

    result.p50CompletionDays = Analytics::percentile(results, numSimulations, 0.5f);
    result.p90CompletionDays = Analytics::percentile(results, numSimulations, 0.9f);

    result.probabilityByDeadline = (float)completedOnTime / (float)numSimulations;

    return result;
}

float MonteCarloSimulator::runSingleSimulation(
    int stages,
    float mean,
    float stdDev)
{
    float totalDays = 0.0f;

    for (int i = 0; i < stages; i++)
    {
        float stageDuration = Analytics::randomLogNormal(mean, stdDev);

        stageDuration = max(1.0f, min(stageDuration, mean * 10.0f));

        totalDays += stageDuration;
    }

    return totalDays;
}
