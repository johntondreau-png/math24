# Flag Subs firmware

Two Arduino sketches for the Seeed XIAO ESP32-C3. Both need the Arduino ESP32 core 3.x
(Boards Manager, "esp32" by Espressif) with board set to "XIAO_ESP32C3".

## subs_device

One per player. Needs the Adafruit NeoPixel library.

Wiring per device:

- WS2812 DIN to D0, VCC to the 3V3 pin (or BAT+ if your pixel is happy at 3.7 V), GND to GND
- LiPo (100 to 500 mAh, JST) to the BAT+ and BAT- pads on the underside of the XIAO

Before flashing each device, set `DEVICE_SLOT` to a value from 0 to 9. Slot 0 is Player 1 in
the simulator, slot 9 is Player 10. Write the slot number on the shell.

LED meaning:

| Color | Meaning |
| --- | --- |
| Green | In |
| Red | Out |
| Blue | Powered on, no packet from the bridge yet |
| Amber | Bridge stopped sending |

## subs_bridge

One unit, stays with the coach. Creates a WiFi network called `FlagSubs` (password
`flagsubs1`) and listens on http://192.168.4.1.

The lineup is a ten character string, slot 1 on the left, `1` for in and `0` for out:

```
http://192.168.4.1/set?mask=1111110000
http://192.168.4.1/state
```

The bridge broadcasts a four byte ESP-NOW packet (magic, sequence, 16 bit mask) to every
device once a second and immediately after each change, so a device that boots late or
misses a packet catches up within a second.

## Connecting the iPad

1. Flash the bridge and power it. Join the iPad to the `FlagSubs` network.
2. Open the simulator, tap Roster, and enter `http://192.168.4.1` in the Bridge field.
3. Tap a group. The tiles and the wearables change together.

Safari blocks a page served over https from calling an http address on the local network.
So for the field test, run the simulator over plain http on a laptop on the same network
(`npm run dev` in `flag-subs`, then open `http://<laptop-ip>:3000` on the iPad) rather than
the Vercel deployment. The Vercel deployment stays useful for the on screen demo.

## Channel note

ESP-NOW only works when sender and receivers sit on the same WiFi channel. Both sketches
pin channel 1. If you ever change the bridge to join an existing router instead of hosting
its own network, the devices must be moved to that router's channel.
