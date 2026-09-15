export const SLOT_COUNT = 10;
export const IN_COUNT = 6;

export type Player = {
  id: number;
  name: string;
};

export type Lineup = boolean[]; // index = slot, true = in

export type PresetKey = "A" | "B" | "C";

export type Preset = {
  key: PresetKey;
  label: string;
  lineup: Lineup;
};

export const PRESET_KEYS: PresetKey[] = ["A", "B", "C"];

export function makeDefaultPlayers(): Player[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => ({
    id: i,
    name: `Player ${i + 1}`,
  }));
}

function lineupFromSlots(inSlots: number[]): Lineup {
  const lineup = Array.from({ length: SLOT_COUNT }, () => false);
  for (const s of inSlots) lineup[s] = true;
  return lineup;
}

export function makeDefaultPresets(): Preset[] {
  return [
    { key: "A", label: "Group A", lineup: lineupFromSlots([0, 1, 2, 3, 4, 5]) },
    { key: "B", label: "Group B", lineup: lineupFromSlots([4, 5, 6, 7, 8, 9]) },
    { key: "C", label: "Group C", lineup: lineupFromSlots([0, 1, 2, 7, 8, 9]) },
  ];
}

export function countIn(lineup: Lineup): number {
  return lineup.filter(Boolean).length;
}

export function isValidLineup(lineup: Lineup): boolean {
  return lineup.length === SLOT_COUNT && countIn(lineup) === IN_COUNT;
}

/**
 * Bit mask the bridge will broadcast over ESP-NOW.
 * Bit i is 1 when slot i is in. Slot 0 is the least significant bit.
 */
export function lineupToMask(lineup: Lineup): number {
  return lineup.reduce((mask, isIn, i) => (isIn ? mask | (1 << i) : mask), 0);
}

/**
 * Ten character string, slot 1 on the left. This is the exact string the
 * simulator sends to the bridge as /set?mask=...
 */
export function lineupToBits(lineup: Lineup): string {
  return lineup.map((isIn) => (isIn ? "1" : "0")).join("");
}

/**
 * Fire and forget push to the hardware bridge. Errors are swallowed so the
 * simulator keeps working with no bridge on the network.
 */
export function pushToBridge(bridgeUrl: string, lineup: Lineup): void {
  const base = bridgeUrl.trim().replace(/\/+$/, "");
  if (!base) return;
  const url = `${base}/set?mask=${lineupToBits(lineup)}`;
  fetch(url, { mode: "no-cors", cache: "no-store" }).catch(() => {});
}
