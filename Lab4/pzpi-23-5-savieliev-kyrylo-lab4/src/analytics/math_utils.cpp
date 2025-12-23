#include "math_utils.h"
#include <math.h>
#include <time.h>

namespace Analytics
{

    static bool hasSpare = false;
    static float spare;

    float randomNormal(float mean, float stdDev)
    {
        if (hasSpare)
        {
            hasSpare = false;
            return spare * stdDev + mean;
        }

        float u, v, s;

        do
        {
            u = (float)random(0, 10000) / 10000.0f * 2.0f - 1.0f;
            v = (float)random(0, 10000) / 10000.0f * 2.0f - 1.0f;
            s = u * u + v * v;
        } while (s >= 1.0f || s == 0.0f);

        s = sqrtf(-2.0f * logf(s) / s);
        spare = v * s;
        hasSpare = true;

        return mean + stdDev * u * s;
    }

    float randomLogNormal(float mean, float stdDev)
    {
        float variance = stdDev * stdDev;
        float mu = logf(mean * mean / sqrtf(variance + mean * mean));
        float sigma = sqrtf(logf(1.0f + variance / (mean * mean)));

        return expf(randomNormal(mu, sigma));
    }

    float mean(const float *values, int count)
    {
        if (count <= 0)
            return 0.0f;

        float sum = 0.0f;
        for (int i = 0; i < count; i++)
        {
            sum += values[i];
        }
        return sum / (float)count;
    }

    float variance(const float *values, int count)
    {
        if (count <= 1)
            return 0.0f;

        float m = mean(values, count);
        float sumSq = 0.0f;
        for (int i = 0; i < count; i++)
        {
            float diff = values[i] - m;
            sumSq += diff * diff;
        }
        return sumSq / (float)(count - 1);
    }

    float stdDev(const float *values, int count)
    {
        return sqrtf(variance(values, count));
    }

    static int partition(float *arr, int low, int high)
    {
        float pivot = arr[high];
        int i = low - 1;

        for (int j = low; j < high; j++)
        {
            if (arr[j] <= pivot)
            {
                i++;
                float temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        float temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        return i + 1;
    }

    void quickSort(float *arr, int low, int high)
    {
        if (low < high)
        {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }

    float percentile(float *sortedValues, int count, float p)
    {
        if (count <= 0)
            return 0.0f;
        if (count == 1)
            return sortedValues[0];

        float index = p * (count - 1);
        int lower = (int)index;
        int upper = lower + 1;
        float weight = index - lower;

        if (upper >= count)
            return sortedValues[count - 1];

        return sortedValues[lower] * (1.0f - weight) + sortedValues[upper] * weight;
    }

    float betaMean(float alpha, float beta)
    {
        return alpha / (alpha + beta);
    }

    unsigned long parseISODate(const char *isoDate)
    {
        if (isoDate == nullptr || strlen(isoDate) < 10)
            return 0;

        struct tm tm = {0};
        int year, month, day, hour = 0, minute = 0, second = 0;

        if (sscanf(isoDate, "%d-%d-%dT%d:%d:%d", &year, &month, &day, &hour, &minute, &second) >= 3)
        {
            tm.tm_year = year - 1900;
            tm.tm_mon = month - 1;
            tm.tm_mday = day;
            tm.tm_hour = hour;
            tm.tm_min = minute;
            tm.tm_sec = second;
            return mktime(&tm);
        }

        return 0;
    }

    float daysUntilDeadline(const char *deadlineDate)
    {
        unsigned long deadline = parseISODate(deadlineDate);
        if (deadline == 0)
            return -1.0f;

        time_t now;
        time(&now);

        return (float)(deadline - (unsigned long)now) / 86400.0f;
    }

}
