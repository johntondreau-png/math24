"use client";

import { useState } from "react";
import PlayerTile from "@/components/PlayerTile";
import RosterEditor from "@/components/RosterEditor";
import {
  IN_COUNT,
  Lineup,
  Preset,
  PresetKey,
  SLOT_COUNT,
  countIn,
  isValidLineup,
  lineupToBits,
  makeDefaultPlayers,
  makeDefaultPresets,
  pushToBridge,
} from "@/lib/lineup";

type Mode = "play" | "roster" | "edit";

export default function Simulator() {
  const [players, setPlayers] = useState(makeDefaultPlayers);
  const [presets, setPresets] = useState<Preset[]>(makeDefaultPresets);
  const [current, setCurrent] = useState<Lineup>(() => makeDefaultPresets()[0].lineup);
  const [activeKey, setActiveKey] = useState<PresetKey | null>("A");
  const [bridgeUrl, setBridgeUrl] = useState("");

  const [mode, setMode] = useState<Mode>("play");
  const [editKey, setEditKey] = useState<PresetKey>("A");
  const [draft, setDraft] = useState<Lineup>(() => makeDefaultPresets()[0].lineup);

  const shown = mode === "edit" ? draft : current;
  const inCount = countIn(shown);
  const bits = lineupToBits(current);

  function applyPreset(key: PresetKey) {
    const preset = presets.find((p) => p.key === key);
    if (!preset || !isValidLineup(preset.lineup)) return;
    setCurrent(preset.lineup);
    setActiveKey(key);
    pushToBridge(bridgeUrl, preset.lineup);
  }

  function startEdit(key: PresetKey) {
    const preset = presets.find((p) => p.key === key)!;
    setEditKey(key);
    setDraft([...preset.lineup]);
    setMode("edit");
  }

  function toggleDraft(slot: number) {
    setDraft((d) => d.map((v, i) => (i === slot ? !v : v)));
  }

  function saveDraft() {
    if (!isValidLineup(draft)) return;
    setPresets((ps) => ps.map((p) => (p.key === editKey ? { ...p, lineup: draft } : p)));
    if (activeKey === editKey) {
      setCurrent(draft);
      pushToBridge(bridgeUrl, draft);
    }
    setMode("play");
  }

  function rename(slot: number, name: string) {
    setPlayers((ps) => ps.map((p) => (p.id === slot ? { ...p, name } : p)));
  }

  function displayName(slot: number) {
    const name = players[slot].name.trim();
    return name.length > 0 ? name : `Player ${slot + 1}`;
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Flag Subs</h1>
          <div className="sub">Tap a group. Green is in, red is out.</div>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className={`chip ${mode === "roster" ? "active" : ""}`}
            onClick={() => setMode(mode === "roster" ? "play" : "roster")}
          >
            Roster
          </button>
          <button
            type="button"
            className={`chip ${mode === "edit" ? "active" : ""}`}
            onClick={() => (mode === "edit" ? setMode("play") : startEdit(activeKey ?? "A"))}
          >
            Edit groups
          </button>
        </div>
      </header>

      {mode === "roster" && (
        <RosterEditor
          players={players}
          onRename={rename}
          bridgeUrl={bridgeUrl}
          onBridgeUrl={setBridgeUrl}
          onClose={() => setMode("play")}
        />
      )}

      {mode === "edit" && (
        <section className="panel">
          <h2>Editing {presets.find((p) => p.key === editKey)!.label}</h2>
          <p>
            Tap tiles to flip them. Save needs exactly {IN_COUNT} in and {SLOT_COUNT - IN_COUNT} out.
          </p>
          <div className="row">
            <button
              type="button"
              className="btn primary"
              onClick={saveDraft}
              disabled={!isValidLineup(draft)}
            >
              Save {presets.find((p) => p.key === editKey)!.label}
            </button>
            <button type="button" className="btn" onClick={() => setMode("play")}>
              Cancel
            </button>
          </div>
        </section>
      )}

      <div className="status">
        <span>
          <strong>{inCount}</strong> in, <strong>{SLOT_COUNT - inCount}</strong> out
          {mode === "edit" && (
            <span className={inCount === IN_COUNT ? " ok" : " warn"}>
              {inCount === IN_COUNT ? " ready to save" : ` need ${IN_COUNT} in`}
            </span>
          )}
        </span>
        <span className="mono" title="What the bridge broadcasts, slot 1 on the left">
          mask {bits}
        </span>
      </div>

      <div className="grid">
        {shown.map((isIn, slot) => (
          <PlayerTile
            key={slot}
            slot={slot}
            name={displayName(slot)}
            isIn={isIn}
            editable={mode === "edit"}
            onToggle={() => toggleDraft(slot)}
          />
        ))}
      </div>

      <nav className="presets">
        {presets.map((p) => {
          const valid = isValidLineup(p.lineup);
          const isActive = mode === "edit" ? editKey === p.key : activeKey === p.key;
          return (
            <button
              key={p.key}
              type="button"
              className={`preset-btn ${isActive ? "active" : ""} ${valid ? "" : "invalid"}`}
              onClick={() => (mode === "edit" ? startEdit(p.key) : applyPreset(p.key))}
              onContextMenu={(e) => {
                e.preventDefault();
                startEdit(p.key);
              }}
            >
              {p.label}
              <small>{mode === "edit" ? "edit" : "tap to apply"}</small>
            </button>
          );
        })}
      </nav>

    </main>
  );
}
