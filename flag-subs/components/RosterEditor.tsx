"use client";

import { Player } from "@/lib/lineup";

type Props = {
  players: Player[];
  onRename: (slot: number, name: string) => void;
  bridgeUrl: string;
  onBridgeUrl: (url: string) => void;
  onClose: () => void;
};

export default function RosterEditor({
  players,
  onRename,
  bridgeUrl,
  onBridgeUrl,
  onClose,
}: Props) {
  return (
    <section className="panel">
      <h2>Roster</h2>
      <p>Each slot maps to one wearable device. Names are for the coach only.</p>
      {players.map((p) => (
        <div className="roster-row" key={p.id}>
          <span className="idx">{p.id + 1}</span>
          <input
            value={p.name}
            placeholder={`Player ${p.id + 1}`}
            maxLength={16}
            autoCapitalize="words"
            onChange={(e) => onRename(p.id, e.target.value)}
          />
        </div>
      ))}
      <h2 style={{ marginTop: 16 }}>Bridge (optional)</h2>
      <p>
        Address of the hardware bridge, for example http://192.168.4.1. Leave blank to run the
        simulator only. Every preset tap sends the mask there.
      </p>
      <div className="roster-row">
        <span className="idx" />
        <input
          value={bridgeUrl}
          placeholder="http://192.168.4.1"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          onChange={(e) => onBridgeUrl(e.target.value)}
        />
      </div>
      <div className="row">
        <button type="button" className="btn primary" onClick={onClose}>
          Done
        </button>
      </div>
    </section>
  );
}
