#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "../config.h"
#include "../analytics/risk_aggregator.h"

class OledDisplay
{
public:
    OledDisplay();

    bool begin();

    void showSummary(const RiskSummary &summary);

    void showManuscriptDetails(
        const char *name,
        float probability,
        RiskLevel level,
        float daysRemaining);

    void showConnecting(const char *ssid);
    void showConnected(const char *ip);
    void showError(const char *message);

    void showSplash();

    void showFetching();

    void clear();

    void update();

private:
    Adafruit_SSD1306 display;
    bool initialized;

    void drawProgressBar(int x, int y, int width, int height, float percentage);

    void drawRiskIndicator(int x, int y, OverallRisk level);

    void drawTruncatedText(int x, int y, const char *text, int maxChars);
};

#endif
