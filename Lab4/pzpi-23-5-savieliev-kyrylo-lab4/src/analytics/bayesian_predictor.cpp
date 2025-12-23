#include "bayesian_predictor.h"
#include "math_utils.h"
#include <math.h>
#include <string.h>

BayesianPredictor::BayesianPredictor()
{
}

DeadlinePrediction BayesianPredictor::predict(
    const ManuscriptData &manuscript,
    float priorMeanDuration,
    float priorStdDev)
{
    DeadlinePrediction result;

    strncpy(result.manuscriptId, manuscript.id, sizeof(result.manuscriptId) - 1);
    result.manuscriptId[sizeof(result.manuscriptId) - 1] = '\0';

    strncpy(result.manuscriptName, manuscript.name, sizeof(result.manuscriptName) - 1);
    result.manuscriptName[sizeof(result.manuscriptName) - 1] = '\0';

    int remainingStages = manuscript.totalStages - manuscript.completedStages;
    float expectedRemainingDays = estimateRemainingDays(manuscript, priorMeanDuration);
    result.expectedDaysRemaining = expectedRemainingDays;

    if (strlen(manuscript.deadlineAt) == 0)
    {
        result.probabilityOnTime = 1.0f;
        result.riskLevel = RISK_LOW;
        return result;
    }

    float daysUntilDeadline = Analytics::daysUntilDeadline(manuscript.deadlineAt);

    if (daysUntilDeadline < 0)
    {
        result.probabilityOnTime = 0.0f;
        result.riskLevel = RISK_CRITICAL;
        return result;
    }

    if (remainingStages <= 0)
    {
        result.probabilityOnTime = 1.0f;
        result.riskLevel = RISK_LOW;
        return result;
    }

    float completionRate = (float)manuscript.completedStages / (float)manuscript.totalStages;

    float posteriorMean = calculatePosteriorMean(
        manuscript.completedStages,
        manuscript.totalStages);

    float bufferRatio = daysUntilDeadline / fmaxf(expectedRemainingDays, 0.1f);

    float timeBasedProb = 1.0f / (1.0f + expf(-2.0f * (bufferRatio - 1.0f)));

    result.probabilityOnTime = 0.6f * timeBasedProb + 0.4f * posteriorMean;

    result.probabilityOnTime = fmaxf(0.0f, fminf(1.0f, result.probabilityOnTime));

    result.riskLevel = determineRiskLevel(result.probabilityOnTime, bufferRatio);

    return result;
}

float BayesianPredictor::calculatePosteriorMean(int successes, int total)
{
    float posteriorAlpha = PRIOR_ALPHA + (float)successes;
    float posteriorBeta = PRIOR_BETA + (float)(total - successes);

    return Analytics::betaMean(posteriorAlpha, posteriorBeta);
}

RiskLevel BayesianPredictor::determineRiskLevel(float probability, float bufferRatio)
{
    if (probability < CRITICAL_THRESHOLD || bufferRatio < 0.5f)
    {
        return RISK_CRITICAL;
    }

    if (probability < HIGH_RISK_THRESHOLD || bufferRatio < 0.8f)
    {
        return RISK_HIGH;
    }

    if (probability < MEDIUM_RISK_THRESHOLD || bufferRatio < 1.2f)
    {
        return RISK_MEDIUM;
    }

    return RISK_LOW;
}

float BayesianPredictor::estimateRemainingDays(
    const ManuscriptData &manuscript,
    float meanStageDuration)
{
    int remainingStages = manuscript.totalStages - manuscript.completedStages;

    if (remainingStages <= 0)
    {
        return 0.0f;
    }

    float avgDuration = (manuscript.avgStageDuration > 0)
                            ? manuscript.avgStageDuration
                            : meanStageDuration;

    return (float)remainingStages * avgDuration;
}
