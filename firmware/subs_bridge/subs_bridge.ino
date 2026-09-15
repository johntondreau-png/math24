// Flag Subs coach bridge
// Board: Seeed XIAO ESP32-C3 (Arduino ESP32 core 3.x)
//
// Runs its own WiFi network for the iPad and rebroadcasts the current
// lineup to every wearable over ESP-NOW once a second, plus immediately
// on every change.
//
// HTTP API (the simulator's Bridge field uses the first one):
//   GET  /set?mask=1111110000   ten chars, slot 1 on the left, 1 = in
//   GET  /state                 returns the current ten char mask
//   GET  /                      plain text status

#include <WiFi.h>
#include <esp_wifi.h>
#include <esp_now.h>
#include <WebServer.h>

#define AP_SSID "FlagSubs"
#define AP_PASS "flagsubs1"      // at least 8 characters
#define WIFI_CHANNEL 1           // must match the devices
#define MAGIC 0x5A
#define SLOT_COUNT 10
#define REBROADCAST_MS 1000

struct __attribute__((packed)) SubsPacket {
  uint8_t magic;
  uint8_t seq;
  uint16_t mask;                 // bit n set means slot n is in
};

const uint8_t BROADCAST_MAC[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
WebServer server(80);
uint16_t currentMask = 0;
uint8_t seq = 0;
uint32_t lastSendMs = 0;

void sendMask() {
  SubsPacket p = {MAGIC, seq++, currentMask};
  esp_now_send(BROADCAST_MAC, (const uint8_t *)&p, sizeof(p));
  lastSendMs = millis();
}

String maskToBits(uint16_t mask) {
  String s;
  for (int i = 0; i < SLOT_COUNT; i++) s += ((mask >> i) & 1) ? '1' : '0';
  return s;
}

void reply(int code, const String &body) {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Cache-Control", "no-store");
  server.send(code, "text/plain", body);
}

void handleSet() {
  String bits = server.arg("mask");
  if (bits.length() != SLOT_COUNT) { reply(400, "mask must be 10 chars of 0 or 1"); return; }
  uint16_t mask = 0;
  for (int i = 0; i < SLOT_COUNT; i++) {
    if (bits[i] == '1') mask |= (1 << i);
    else if (bits[i] != '0') { reply(400, "mask must be 10 chars of 0 or 1"); return; }
  }
  currentMask = mask;
  sendMask();
  Serial.printf("set %s\n", bits.c_str());
  reply(200, bits);
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASS, WIFI_CHANNEL);
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
  esp_now_init();
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, BROADCAST_MAC, 6);
  peer.channel = WIFI_CHANNEL;
  peer.ifidx = WIFI_IF_STA;
  peer.encrypt = false;
  esp_now_add_peer(&peer);
  server.on("/set", handleSet);
  server.on("/state", []() { reply(200, maskToBits(currentMask)); });
  server.on("/", []() { reply(200, "Flag Subs bridge. mask " + maskToBits(currentMask)); });
  server.begin();
  Serial.print("bridge up at http://");
  Serial.println(WiFi.softAPIP());
}

void loop() {
  server.handleClient();
  if (millis() - lastSendMs > REBROADCAST_MS) sendMask();
}
