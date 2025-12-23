#ifndef LED_CONTROLLER_H
#define LED_CONTROLLER_H

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include "../config.h"
#include "../analytics/risk_aggregator.h"

class LedController
{
public:
    LedController();

    void begin();

    void setRiskLevel(OverallRisk level);

    void update();

    void setColor(uint8_t r, uint8_t g, uint8_t b);

    void setBrightness(uint8_t brightness);

    void clear();

    void startupAnimation();

    void showConnecting();
    void showConnected();
    void showError();

private:
    Adafruit_NeoPixel strip;
    OverallRisk currentRisk;
    unsigned long lastUpdate;
    bool flashState;
    uint8_t animationPhase;

    static constexpr unsigned long FLASH_INTERVAL_MS = 250;
    static constexpr unsigned long PULSE_INTERVAL_MS = 50;

    static constexpr uint32_t COLOR_GREEN = 0x00FF00;
    static constexpr uint32_t COLOR_YELLOW = 0xFFFF00;
    static constexpr uint32_t COLOR_RED = 0xFF0000;
    static constexpr uint32_t COLOR_BLUE = 0x0000FF;
    static constexpr uint32_t COLOR_WHITE = 0xFFFFFF;

    void setAllPixels(uint32_t color);
};

#endif
