#include "oled_display.h"

OledDisplay::OledDisplay()
    : display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1), initialized(false)
{
}

bool OledDisplay::begin()
{
    Wire.begin(OLED_SDA, OLED_SCL);

    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS))
    {
        return false;
    }

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.display();

    initialized = true;

    return true;
}

void OledDisplay::showSplash()
{
    if (!initialized)
        return;

    display.clearDisplay();
    display.setTextSize(2);
    display.setCursor(20, 10);
    display.println("INKLY");
    display.setTextSize(1);
    display.setCursor(15, 35);
    display.println("Deadline Tower");
    display.setCursor(30, 50);
    display.println("v1.0.0");
    display.display();
}

void OledDisplay::showConnecting(const char *ssid)
{
    if (!initialized)
        return;

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(20, 10);
    display.println("Connecting to");
    display.setCursor(0, 25);
    drawTruncatedText(0, 25, ssid, 21);
    display.setCursor(50, 45);
    display.println("...");
    display.display();
}

void OledDisplay::showConnected(const char *ip)
{
    if (!initialized)
        return;

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(30, 10);
    display.println("Connected!");
    display.setCursor(20, 35);
    display.println(ip);
    display.display();
}

void OledDisplay::showError(const char *message)
{
    if (!initialized)
        return;

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(40, 5);
    display.println("ERROR");
    display.drawLine(0, 15, 128, 15, SSD1306_WHITE);
    display.setCursor(0, 25);

    int len = strlen(message);
    int pos = 0;
    int y = 25;
    while (pos < len && y < 60)
    {
        int lineLen = min(21, len - pos);
        for (int i = 0; i < lineLen; i++)
        {
            display.print(message[pos + i]);
        }
        display.println();
        pos += lineLen;
        y += 10;
    }

    display.display();
}

void OledDisplay::showFetching()
{
    if (!initialized)
        return;

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(20, 25);
    display.println("Fetching data...");
    display.display();
}

void OledDisplay::showSummary(const RiskSummary &summary)
{
    if (!initialized)
        return;

    display.clearDisplay();

    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("Status: ");
    display.println(riskLevelToString(summary.level));
    display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

    display.setCursor(0, 14);
    display.print("Total: ");
    display.println(summary.totalManuscripts);

    display.setCursor(0, 24);
    display.print("Critical: ");
    display.print(summary.criticalCount);
    display.print("  High: ");
    display.println(summary.highRiskCount);

    display.setCursor(0, 36);
    display.print("Avg On-Time: ");
    display.print((int)(summary.avgProbabilityOnTime * 100));
    display.println("%");
    drawProgressBar(0, 46, 100, 6, summary.avgProbabilityOnTime);

    if (summary.totalManuscripts > 0 && summary.minProbabilityOnTime < 1.0f)
    {
        display.setCursor(0, 55);
        display.print("! ");
        drawTruncatedText(12, 55, summary.urgentManuscriptName, 18);
    }

    display.display();
}

void OledDisplay::showManuscriptDetails(
    const char *name,
    float probability,
    RiskLevel level,
    float daysRemaining)
{
    if (!initialized)
        return;

    display.clearDisplay();

    display.setTextSize(1);
    display.setCursor(0, 0);
    drawTruncatedText(0, 0, name, 21);
    display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

    display.setCursor(0, 14);
    display.print("Risk: ");
    display.println(manuscriptRiskToString(level));

    display.setCursor(0, 26);
    display.print("On-Time: ");
    display.print((int)(probability * 100));
    display.println("%");
    drawProgressBar(0, 36, 100, 8, probability);

    display.setCursor(0, 50);
    display.print("Est. Days: ");
    display.println((int)daysRemaining);

    display.display();
}

void OledDisplay::clear()
{
    if (!initialized)
        return;

    display.clearDisplay();
    display.display();
}

void OledDisplay::drawProgressBar(int x, int y, int width, int height, float percentage)
{
    display.drawRect(x, y, width, height, SSD1306_WHITE);

    int fillWidth = (int)(percentage * (width - 2));
    if (fillWidth > 0)
    {
        display.fillRect(x + 1, y + 1, fillWidth, height - 2, SSD1306_WHITE);
    }
}

void OledDisplay::drawRiskIndicator(int x, int y, OverallRisk level)
{
    int radius = 6;

    switch (level)
    {
    case OverallRisk::GREEN:
        display.fillCircle(x, y, radius, SSD1306_WHITE);
        break;
    case OverallRisk::YELLOW:
        display.drawCircle(x, y, radius, SSD1306_WHITE);
        display.fillCircle(x, y, radius / 2, SSD1306_WHITE);
        break;
    case OverallRisk::RED:
    case OverallRisk::FLASHING:
        display.drawCircle(x, y, radius, SSD1306_WHITE);
        break;
    }
}

void OledDisplay::drawTruncatedText(int x, int y, const char *text, int maxChars)
{
    display.setCursor(x, y);

    int len = strlen(text);
    if (len <= maxChars)
    {
        display.print(text);
    }
    else
    {
        for (int i = 0; i < maxChars - 2; i++)
        {
            display.print(text[i]);
        }
        display.print("..");
    }
}
