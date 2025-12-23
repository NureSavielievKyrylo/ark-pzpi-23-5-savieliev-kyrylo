#include "led_controller.h"

LedController::LedController()
    : strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800), currentRisk(OverallRisk::GREEN), lastUpdate(0), flashState(false), animationPhase(0)
{
}

void LedController::begin()
{
    strip.begin();
    strip.setBrightness(128);
    strip.show();
}

void LedController::setRiskLevel(OverallRisk level)
{
    if (level != currentRisk)
    {
        currentRisk = level;
        flashState = true;
        animationPhase = 0;
    }
}

void LedController::update()
{
    unsigned long now = millis();

    switch (currentRisk)
    {
    case OverallRisk::GREEN:
        setAllPixels(COLOR_GREEN);
        break;

    case OverallRisk::YELLOW:
        setAllPixels(COLOR_YELLOW);
        break;

    case OverallRisk::RED:
        setAllPixels(COLOR_RED);
        break;

    case OverallRisk::FLASHING:
        if (now - lastUpdate >= FLASH_INTERVAL_MS)
        {
            flashState = !flashState;
            setAllPixels(flashState ? COLOR_RED : COLOR_WHITE);
            lastUpdate = now;
        }
        break;
    }

    strip.show();
}

void LedController::setColor(uint8_t r, uint8_t g, uint8_t b)
{
    for (int i = 0; i < LED_COUNT; i++)
    {
        strip.setPixelColor(i, strip.Color(r, g, b));
    }
    strip.show();
}

void LedController::setBrightness(uint8_t brightness)
{
    strip.setBrightness(brightness);
    strip.show();
}

void LedController::clear()
{
    strip.clear();
    strip.show();
}

void LedController::setAllPixels(uint32_t color)
{
    for (int i = 0; i < LED_COUNT; i++)
    {
        strip.setPixelColor(i, color);
    }
}

void LedController::startupAnimation()
{
    uint32_t colors[] = {COLOR_RED, COLOR_YELLOW, COLOR_GREEN, COLOR_BLUE};

    for (int c = 0; c < 4; c++)
    {
        for (int i = 0; i < LED_COUNT; i++)
        {
            strip.setPixelColor(i, colors[c]);
            strip.show();
            delay(100);
        }
    }

    clear();
    delay(200);

    setAllPixels(COLOR_WHITE);
    strip.show();
    delay(200);
    clear();
}

void LedController::showConnecting()
{
    static uint8_t brightness = 0;
    static bool increasing = true;

    if (increasing)
    {
        brightness += 5;
        if (brightness >= 250)
            increasing = false;
    }
    else
    {
        brightness -= 5;
        if (brightness <= 5)
            increasing = true;
    }

    strip.setBrightness(brightness);
    setAllPixels(COLOR_BLUE);
    strip.show();
}

void LedController::showConnected()
{
    for (int i = 0; i < 3; i++)
    {
        setAllPixels(COLOR_GREEN);
        strip.show();
        delay(150);
        clear();
        delay(150);
    }

    strip.setBrightness(128);
}

void LedController::showError()
{
    for (int i = 0; i < 5; i++)
    {
        setAllPixels(COLOR_RED);
        strip.show();
        delay(100);
        clear();
        delay(100);
    }
}
