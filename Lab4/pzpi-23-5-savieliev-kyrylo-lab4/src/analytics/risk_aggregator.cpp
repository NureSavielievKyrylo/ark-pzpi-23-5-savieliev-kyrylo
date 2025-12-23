#include "risk_aggregator.h"
#include <string.h>
#include <float.h>

RiskAggregator::RiskAggregator()
{
}

RiskSummary RiskAggregator::aggregate(
    const DeadlinePrediction *predictions,
    int count)
{
    RiskSummary summary;
    memset(&summary, 0, sizeof(summary));

    summary.totalManuscripts = count;
    summary.minProbabilityOnTime = 1.0f;

    if (count == 0)
    {
        summary.level = OverallRisk::GREEN;
        return summary;
    }

    float sumProbability = 0.0f;
    float lowestProb = 1.0f;
    int lowestProbIndex = -1;

    for (int i = 0; i < count; i++)
    {
        const DeadlinePrediction &pred = predictions[i];

        switch (pred.riskLevel)
        {
        case RISK_CRITICAL:
            summary.criticalCount++;
            break;
        case RISK_HIGH:
            summary.highRiskCount++;
            break;
        case RISK_MEDIUM:
            summary.mediumRiskCount++;
            break;
        case RISK_LOW:
            summary.lowRiskCount++;
            break;
        }

        sumProbability += pred.probabilityOnTime;

        if (pred.probabilityOnTime < lowestProb)
        {
            lowestProb = pred.probabilityOnTime;
            lowestProbIndex = i;
        }
    }

    summary.avgProbabilityOnTime = sumProbability / (float)count;
    summary.minProbabilityOnTime = lowestProb;

    if (lowestProbIndex >= 0)
    {
        strncpy(
            summary.urgentManuscriptName,
            predictions[lowestProbIndex].manuscriptName,
            sizeof(summary.urgentManuscriptName) - 1);
        summary.urgentManuscriptName[sizeof(summary.urgentManuscriptName) - 1] = '\0';
        summary.urgentManuscriptProb = lowestProb;
    }

    summary.level = determineOverallRisk(
        summary.criticalCount,
        summary.highRiskCount,
        summary.totalManuscripts);

    return summary;
}

OverallRisk RiskAggregator::determineOverallRisk(
    int critical,
    int highRisk,
    int total)
{
    if (total == 0)
    {
        return OverallRisk::GREEN;
    }

    if (critical >= 2 || (highRisk + critical) > total / 2)
    {
        return OverallRisk::FLASHING;
    }

    if (critical > 0)
    {
        return OverallRisk::RED;
    }

    if (highRisk > 0)
    {
        return OverallRisk::YELLOW;
    }

    return OverallRisk::GREEN;
}

bool RiskAggregator::hasRiskIncreased(
    const RiskSummary &previous,
    const RiskSummary &current)
{
    if (static_cast<uint8_t>(current.level) > static_cast<uint8_t>(previous.level))
    {
        return true;
    }

    if (current.level == previous.level && current.criticalCount > previous.criticalCount)
    {
        return true;
    }

    return false;
}

const char *riskLevelToString(OverallRisk level)
{
    switch (level)
    {
    case OverallRisk::GREEN:
        return "GREEN";
    case OverallRisk::YELLOW:
        return "YELLOW";
    case OverallRisk::RED:
        return "RED";
    case OverallRisk::FLASHING:
        return "CRITICAL";
    default:
        return "UNKNOWN";
    }
}

const char *manuscriptRiskToString(RiskLevel level)
{
    switch (level)
    {
    case RISK_LOW:
        return "Low";
    case RISK_MEDIUM:
        return "Medium";
    case RISK_HIGH:
        return "High";
    case RISK_CRITICAL:
        return "Critical";
    default:
        return "Unknown";
    }
}
