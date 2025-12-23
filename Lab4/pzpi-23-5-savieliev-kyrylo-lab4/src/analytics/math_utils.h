#ifndef MATH_UTILS_H
#define MATH_UTILS_H

#include <Arduino.h>

namespace Analytics
{

  float randomNormal(float mean, float stdDev);

  float randomLogNormal(float mean, float stdDev);

  float mean(const float *values, int count);
  float stdDev(const float *values, int count);
  float variance(const float *values, int count);

  float percentile(float *sortedValues, int count, float p);

  void quickSort(float *arr, int low, int high);

  float betaMean(float alpha, float beta);

  float daysUntilDeadline(const char *deadlineDate);

  unsigned long parseISODate(const char *isoDate);

}

#endif
