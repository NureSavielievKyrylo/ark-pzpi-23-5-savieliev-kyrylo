#ifndef BUZZER_CONTROLLER_H
#define BUZZER_CONTROLLER_H

#include <Arduino.h>
#include "../config.h"
#include "../analytics/risk_aggregator.h"

class BuzzerController
{
public:
    BuzzerController();

    void begin();

    void alert(OverallRisk level);

    void beep(int frequency, int duration);
    void beepSequence(const int *frequencies, const int *durations, int count);

    void alertCritical();
    void alertWarning();
    void alertInfo();
    void alertSuccess();

    void playStartup();

    void update();

    void stop();

    void setEnabled(bool enabled);
    bool isEnabled() const;

private:
    bool enabled;
    bool isPlaying;
    unsigned long playEndTime;

    static constexpr int PWM_CHANNEL = 0;
    static constexpr int PWM_RESOLUTION = 8;
};

#endif
