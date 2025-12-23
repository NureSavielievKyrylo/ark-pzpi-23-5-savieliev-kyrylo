#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "analytics/bayesian_predictor.h"

struct IoTDataResponse
{
    bool success;
    char timestamp[25];
    ManuscriptData manuscripts[MAX_MANUSCRIPTS];
    int manuscriptCount;
    float historicalDurations[100];
    int durationCount;
    char errorMessage[128];
};

class ApiClient
{
public:
    ApiClient();

    IoTDataResponse fetchDeadlineData();
    int getLastResponseCode() const;
    const char *getLastError() const;

private:
    int lastResponseCode;
    char lastError[128];

    bool parseResponse(const String &json, IoTDataResponse &response);
    bool parseManuscript(JsonObject &obj, ManuscriptData &manuscript);
};

#endif
