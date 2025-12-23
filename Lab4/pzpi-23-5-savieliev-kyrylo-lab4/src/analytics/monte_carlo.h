#ifndef MONTE_CARLO_H
#define MONTE_CARLO_H

#include <Arduino.h>
#include "../config.h"

struct SimulationResult
{
    char manuscriptId[37];
    float p50CompletionDays;
    float p90CompletionDays;
    float probabilityByDeadline;
    int simulationsRun;
};

class MonteCarloSimulator
{
public:
    MonteCarloSimulator();

    SimulationResult simulate(
        const char *manuscriptId,
        int remainingStages,
        float meanStageDuration,
        float stdDevStageDuration,
        float daysUntilDeadline);

    void setSimulationCount(int count);

private:
    int numSimulations;

    float runSingleSimulation(
        int stages,
        float mean,
        float stdDev);

    float results[NUM_SIMULATIONS];
};

#endif
