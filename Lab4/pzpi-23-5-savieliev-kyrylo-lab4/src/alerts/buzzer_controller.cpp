#include "buzzer_controller.h"

BuzzerController::BuzzerController()
    : enabled(true), isPlaying(false), playEndTime(0)
{
}

void BuzzerController::begin()
{
    ledcSetup(PWM_CHANNEL, 2000, PWM_RESOLUTION);
    ledcAttachPin(BUZZER_PIN, PWM_CHANNEL);
    ledcWrite(PWM_CHANNEL, 0);
}

void BuzzerController::alert(OverallRisk level)
{
    if (!enabled)
        return;

    switch (level)
    {
    case OverallRisk::FLASHING:
        alertCritical();
        break;
    case OverallRisk::RED:
        alertWarning();
        break;
    case OverallRisk::YELLOW:
        alertInfo();
        break;
    case OverallRisk::GREEN:
        break;
    }
}

void BuzzerController::beep(int frequency, int duration)
{
    if (!enabled)
        return;

    ledcWriteTone(PWM_CHANNEL, frequency);
    delay(duration);
    ledcWrite(PWM_CHANNEL, 0);
}

void BuzzerController::beepSequence(const int *frequencies, const int *durations, int count)
{
    if (!enabled)
        return;

    for (int i = 0; i < count; i++)
    {
        if (frequencies[i] > 0)
        {
            ledcWriteTone(PWM_CHANNEL, frequencies[i]);
        }
        else
        {
            ledcWrite(PWM_CHANNEL, 0);
        }
        delay(durations[i]);
    }
    ledcWrite(PWM_CHANNEL, 0);
}

void BuzzerController::alertCritical()
{
    const int frequencies[] = {2000, 0, 2000, 0, 2000, 0, 2500, 0, 2500};
    const int durations[] = {100, 50, 100, 50, 100, 100, 150, 50, 150};
    beepSequence(frequencies, durations, 9);
}

void BuzzerController::alertWarning()
{
    const int frequencies[] = {1500, 0, 1500};
    const int durations[] = {200, 100, 200};
    beepSequence(frequencies, durations, 3);
}

void BuzzerController::alertInfo()
{
    beep(1000, 100);
}

void BuzzerController::alertSuccess()
{
    const int frequencies[] = {800, 1000, 1200};
    const int durations[] = {100, 100, 200};
    beepSequence(frequencies, durations, 3);
}

void BuzzerController::playStartup()
{
    if (!enabled)
        return;

    const int frequencies[] = {523, 659, 784, 1047};
    const int durations[] = {100, 100, 100, 200};
    beepSequence(frequencies, durations, 4);
}

void BuzzerController::update()
{
    if (isPlaying && millis() >= playEndTime)
    {
        ledcWrite(PWM_CHANNEL, 0);
        isPlaying = false;
    }
}

void BuzzerController::stop()
{
    ledcWrite(PWM_CHANNEL, 0);
    isPlaying = false;
}

void BuzzerController::setEnabled(bool en)
{
    enabled = en;
    if (!enabled)
    {
        stop();
    }
}

bool BuzzerController::isEnabled() const
{
    return enabled;
}
