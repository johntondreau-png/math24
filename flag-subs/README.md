# Flag Subs simulator

Mobile first, single page Next.js app. A coach taps a preset group and ten player tiles
show green (in) or red (out). This is the on screen proof of concept for the wearable LED
system; the firmware lives in `../firmware`.

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000 on a phone or iPad on the same network for the real feel.

## Deploy to Vercel

Import the repo and set the project's Root Directory to `flag-subs`. Everything else is the
Next.js default.

## How it works

- Ten slots. Each slot is one wearable device. Names are editable under Roster.
- Three presets, Group A, B and C. Each holds exactly 6 in and 4 out.
- Tap a group button at the bottom to apply it. Tap Edit groups, pick a group, tap tiles to
  flip them, then Save. Save stays disabled until the count is 6 in.
- State lives in memory. Reloading the page resets it.
- The `mask` line under the header is the ten character string the bridge receives, slot 1
  on the left. Enter the bridge address under Roster to have every tap push it to hardware.
