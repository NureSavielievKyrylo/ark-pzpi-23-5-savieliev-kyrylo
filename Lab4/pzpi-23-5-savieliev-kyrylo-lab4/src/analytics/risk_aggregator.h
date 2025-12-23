#ifndef RISK_AGGREGATOR_H
#define RISK_AGGREGATOR_H

#include <Arduino.h>
#include "bayesian_predictor.h"
#include "../config.h"

enum class OverallRisk : uint8_t
{
    GREEN = 0,
    YELLOW = 1,
    RED = 2,
    FLASHING = 3
};

struct RiskSummary
{
    OverallRisk level;
    uint8_t criticalCount;
    uint8_t highRiskCount;
    uint8_t mediumRiskCount;
    uint8_t lowRiskCount;
    uint8_t totalManuscripts;
    float avgProbabilityOnTime;
    float minProbabilityOnTime;

    char urgentManuscriptName[64];
    float urgentManuscriptProb;
};

class RiskAggregator
{
public:
    RiskAggregator();

    RiskSummary aggregate(
        const DeadlinePrediction *predictions,
        int count);

    bool hasRiskIncreased(
        const RiskSummary &previous,
        const RiskSummary &current);

private:
    OverallRisk determineOverallRisk(
        int critical,
        int highRisk,
        int total);
};

const char *riskLevelToString(OverallRisk level);
const char *manuscriptRiskToString(RiskLevel level);

#endif
