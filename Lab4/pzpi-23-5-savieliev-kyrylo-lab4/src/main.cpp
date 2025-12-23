#include <Arduino.h>
#include "config.h"
#include "api_client.h"
#include "analytics/math_utils.h"
#include "analytics/bayesian_predictor.h"
#include "analytics/monte_carlo.h"
#include "analytics/risk_aggregator.h"
#include "display/led_controller.h"
#include "display/oled_display.h"
#include "alerts/buzzer_controller.h"

ApiClient apiClient;
BayesianPredictor bayesian;
MonteCarloSimulator monteCarlo;
RiskAggregator aggregator;
LedController ledController;
OledDisplay oledDisplay;
BuzzerController buzzer;

RiskSummary previousRisk;
DeadlinePrediction predictions[MAX_MANUSCRIPTS];
unsigned long lastFetch = 0;
bool firstRun = true;

void processAndDisplay(const IoTDataResponse &data);

void setup()
{
  delay(1000);

  randomSeed(analogRead(0));

  ledController.begin();
  ledController.startupAnimation();

  if (oledDisplay.begin())
  {
    oledDisplay.showSplash();
    delay(2000);
  }

  buzzer.begin();
  buzzer.playStartup();

  memset(&previousRisk, 0, sizeof(previousRisk));
  previousRisk.level = OverallRisk::GREEN;
}

void loop()
{
  unsigned long now = millis();

  if (firstRun || (now - lastFetch >= FETCH_INTERVAL_MS))
  {
    oledDisplay.showFetching();
    IoTDataResponse data = apiClient.fetchDeadlineData();

    if (data.success)
    {
      processAndDisplay(data);
      lastFetch = now;
      firstRun = false;
    }
    else
    {
      oledDisplay.showError(data.errorMessage);
      ledController.showError();
      lastFetch = now - FETCH_INTERVAL_MS + 30000;
    }
  }

  ledController.update();
  delay(DISPLAY_UPDATE_MS);
}

void processAndDisplay(const IoTDataResponse &data)
{
  float priorMean = 7.0f;
  float priorStdDev = 3.5f;

  if (data.durationCount > 0)
  {
    priorMean = Analytics::mean(data.historicalDurations, data.durationCount);
    priorStdDev = Analytics::stdDev(data.historicalDurations, data.durationCount);
  }

  int predictionCount = 0;

  for (int i = 0; i < data.manuscriptCount && i < MAX_MANUSCRIPTS; i++)
  {
    const ManuscriptData &ms = data.manuscripts[i];

    if (strcmp(ms.status, "completed") == 0 || strcmp(ms.status, "archived") == 0)
    {
      continue;
    }

    predictions[predictionCount] = bayesian.predict(ms, priorMean, priorStdDev);

    if (predictions[predictionCount].riskLevel >= RISK_MEDIUM)
    {
      int remainingStages = ms.totalStages - ms.completedStages;
      float daysUntilDeadline = Analytics::daysUntilDeadline(ms.deadlineAt);

      if (remainingStages > 0 && daysUntilDeadline > 0)
      {
        SimulationResult sim = monteCarlo.simulate(
            ms.id, remainingStages, priorMean, priorStdDev, daysUntilDeadline);

        if (sim.probabilityByDeadline < predictions[predictionCount].probabilityOnTime)
        {
          predictions[predictionCount].probabilityOnTime = sim.probabilityByDeadline;
        }
      }
    }

    predictionCount++;
  }

  RiskSummary currentRisk = aggregator.aggregate(predictions, predictionCount);

  ledController.setRiskLevel(currentRisk.level);
  oledDisplay.showSummary(currentRisk);

  if (aggregator.hasRiskIncreased(previousRisk, currentRisk))
  {
    buzzer.alert(currentRisk.level);
  }

  previousRisk = currentRisk;
}
