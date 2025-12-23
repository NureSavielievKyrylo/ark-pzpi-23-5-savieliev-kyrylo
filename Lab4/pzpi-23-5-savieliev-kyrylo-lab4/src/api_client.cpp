#include "api_client.h"

ApiClient::ApiClient() : lastResponseCode(0)
{
    lastError[0] = '\0';
}

IoTDataResponse ApiClient::fetchDeadlineData()
{
    IoTDataResponse response;
    memset(&response, 0, sizeof(response));
    response.success = false;

    String payload = R"({
  "timestamp": "2025-12-23T04:24:00.907Z",
  "manuscripts": [
    {
      "id": "019b4964-1d6f-7900-9e69-77264810ab8d",
      "name": "Martin Eden Book Manuscript2",
      "deadlineAt": "2025-12-31T00:00:00.000Z",
      "createdAt": "2025-12-23T04:07:36.551Z",
      "status": "draft",
      "stages": [
        {
          "createdAt": "2025-12-23T04:23:07.007Z",
          "finishedAt": null
        }
      ]
    }
  ],
  "historicalStageDurations": []
})";

    lastResponseCode = 200;

    if (!parseResponse(payload, response))
    {
        strcpy(response.errorMessage, lastError);
        return response;
    }

    response.success = true;
    return response;
}

bool ApiClient::parseResponse(const String &json, IoTDataResponse &response)
{
    DynamicJsonDocument doc(16384);
    DeserializationError error = deserializeJson(doc, json);

    if (error)
    {
        snprintf(lastError, sizeof(lastError), "JSON error: %s", error.c_str());
        return false;
    }

    strncpy(response.timestamp, doc["timestamp"] | "", sizeof(response.timestamp) - 1);

    JsonArray manuscripts = doc["manuscripts"].as<JsonArray>();
    response.manuscriptCount = 0;

    for (JsonObject ms : manuscripts)
    {
        if (response.manuscriptCount >= MAX_MANUSCRIPTS)
            break;
        if (parseManuscript(ms, response.manuscripts[response.manuscriptCount]))
        {
            response.manuscriptCount++;
        }
    }

    JsonArray durations = doc["historicalStageDurations"].as<JsonArray>();
    response.durationCount = 0;

    for (JsonVariant v : durations)
    {
        if (response.durationCount >= 100)
            break;
        response.historicalDurations[response.durationCount++] = v.as<float>();
    }

    return true;
}

bool ApiClient::parseManuscript(JsonObject &obj, ManuscriptData &manuscript)
{
    strncpy(manuscript.id, obj["id"] | "", sizeof(manuscript.id) - 1);
    manuscript.id[sizeof(manuscript.id) - 1] = '\0';

    strncpy(manuscript.name, obj["name"] | "Untitled", sizeof(manuscript.name) - 1);
    manuscript.name[sizeof(manuscript.name) - 1] = '\0';

    strncpy(manuscript.deadlineAt, obj["deadlineAt"] | "", sizeof(manuscript.deadlineAt) - 1);
    strncpy(manuscript.createdAt, obj["createdAt"] | "", sizeof(manuscript.createdAt) - 1);
    strncpy(manuscript.status, obj["status"] | "", sizeof(manuscript.status) - 1);

    JsonArray stages = obj["stages"].as<JsonArray>();
    manuscript.totalStages = stages.size();
    manuscript.completedStages = 0;

    float totalDuration = 0.0f;
    int completedCount = 0;

    for (JsonObject stage : stages)
    {
        const char *finishedAt = stage["finishedAt"] | "";
        const char *stageCreatedAt = stage["createdAt"] | "";

        if (strlen(finishedAt) > 0)
        {
            manuscript.completedStages++;

            if (strlen(stageCreatedAt) > 0)
            {
                struct tm tm = {0};
                int y, m, d, h, mi, s;
                unsigned long start = 0, end = 0;

                if (sscanf(stageCreatedAt, "%d-%d-%dT%d:%d:%d", &y, &m, &d, &h, &mi, &s) >= 3)
                {
                    tm.tm_year = y - 1900;
                    tm.tm_mon = m - 1;
                    tm.tm_mday = d;
                    start = mktime(&tm);
                }
                if (sscanf(finishedAt, "%d-%d-%dT%d:%d:%d", &y, &m, &d, &h, &mi, &s) >= 3)
                {
                    tm.tm_year = y - 1900;
                    tm.tm_mon = m - 1;
                    tm.tm_mday = d;
                    end = mktime(&tm);
                }

                if (start > 0 && end > start)
                {
                    totalDuration += (float)(end - start) / 86400.0f;
                    completedCount++;
                }
            }
        }
    }

    manuscript.avgStageDuration = (completedCount > 0) ? totalDuration / completedCount : 0.0f;

    return strlen(manuscript.id) > 0;
}

int ApiClient::getLastResponseCode() const
{
    return lastResponseCode;
}

const char *ApiClient::getLastError() const
{
    return lastError;
}
