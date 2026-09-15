// Flag Subs wearable device
// Board: Seeed XIAO ESP32-C3 (Arduino ESP32 core 3.x)
// Parts: one WS2812 NeoPixel on D0, LiPo on the battery pads
// Library: Adafruit NeoPixel
//
// Listens for the bridge's ESP-NOW broadcast, reads its own slot bit,
// and shows green (in) or red (out). Blue means no packet yet, amber
// means the bridge went quiet.

#include <WiFi.h>
#include <esp_wifi.h>
#include <esp_now.h>
#include <Adafruit_NeoPixel.h>

#define DEVICE_SLOT 0        // 0 to 9, change per device before flashing
#define LED_PIN D0           // XIAO ESP32-C3 D0 is GPIO2
#define BRIGHTNESS 60        // 0 to 255
#define WIFI_CHANNEL 1       // must match the bridge
#define MAGIC 0x5A
#define TIMEOUT_MS 5000      // bridge rebroadcasts every second

struct __attribute__((packed)) SubsPacket {
  uint8_t magic;
  uint8_t seq;
  uint16_t mask;             // bit n set means slot n is in
};

Adafruit_NeoPixel pixel(1, LED_PIN, NEO_GRB + NEO_KHZ800);
volatile bool haveState = false;
volatile bool isIn = false;
volatile uint32_t lastPacketMs = 0;

void onReceive(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len != sizeof(SubsPacket)) return;
  const SubsPacket *p = (const SubsPacket *)data;
  if (p->magic != MAGIC) return;
  isIn = (p->mask >> DEVICE_SLOT) & 1;
  haveState = true;
  lastPacketMs = millis();
}

void show(uint8_t r, uint8_t g, uint8_t b) {
  pixel.setPixelColor(0, pixel.Color(r, g, b));
  pixel.show();
}

void setup() {
  pixel.begin();
  pixel.setBrightness(BRIGHTNESS);
  show(0, 0, 255);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
  esp_now_init();
  esp_now_register_recv_cb(onReceive);
}

void loop() {
  if (!haveState) show(0, 0, 255);
  else if (millis() - lastPacketMs > TIMEOUT_MS) show(255, 120, 0);
  else if (isIn) show(0, 255, 0);
  else show(255, 0, 0);
  delay(50);
}
