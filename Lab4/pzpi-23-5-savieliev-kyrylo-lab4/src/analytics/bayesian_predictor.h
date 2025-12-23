#ifndef BAYESIAN_PREDICTOR_H
#define BAYESIAN_PREDICTOR_H

#include <Arduino.h>
#include "../config.h"

enum RiskLevel : uint8_t
{
    RISK_LOW = 0,
    RISK_MEDIUM = 1,
    RISK_HIGH = 2,
    RISK_CRITICAL = 3
};

struct ManuscriptData
{
    char id[37];
    char name[64];
    char deadlineAt[25];
    char createdAt[25];
    char status[32];
    int totalStages;
    int completedStages;
    float avgStageDuration;
};

struct DeadlinePrediction
{
    char manuscriptId[37];
    char manuscriptName[64];
    float probabilityOnTime;
    float expectedDaysRemaining;
    RiskLevel riskLevel;
};

class BayesianPredictor
{
public:
    static constexpr float PRIOR_ALPHA = 2.0f;
    static constexpr float PRIOR_BETA = 2.0f;

    BayesianPredictor();

    DeadlinePrediction predict(
        const ManuscriptData &manuscript,
        float priorMeanDuration,
        float priorStdDev);

private:
    float calculatePosteriorMean(int successes, int total);

    RiskLevel determineRiskLevel(float probability, float bufferRatio);

    float estimateRemainingDays(
        const ManuscriptData &manuscript,
        float meanStageDuration);
};

#endif
