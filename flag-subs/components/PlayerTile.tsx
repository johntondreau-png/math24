"use client";

type Props = {
  slot: number;
  name: string;
  isIn: boolean;
  editable: boolean;
  onToggle?: () => void;
};

export default function PlayerTile({ slot, name, isIn, editable, onToggle }: Props) {
  const state = isIn ? "in" : "out";
  return (
    <button
      type="button"
      className={`tile ${editable ? "editable" : ""}`}
      onClick={editable ? onToggle : undefined}
      disabled={!editable}
      aria-label={`${name}, slot ${slot + 1}, ${state}`}
    >
      <div className={`dot ${state}`} />
      <div className="name">{name}</div>
      <div className={`state ${state}`}>{state}</div>
      <div className="slot">Slot {slot + 1}</div>
    </button>
  );
}
