"use client";

import { CSSProperties } from "react";
import { PlayerData } from "./gameData";
import { C, pixelBorder } from "./styles";

export default function PlayerCard({ player }: { player: PlayerData }) {
  const hpPct  = (player.hp.current / player.hp.max) * 100;
  const mpPct  = (player.mp.current / player.mp.max) * 100;

  const outer: CSSProperties = {
    ...pixelBorder,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  };

  const avatarFrame: CSSProperties = {
    ...pixelBorder,
    width: 128,
    height: 128,
    backgroundColor: "#000",
    marginBottom: 16,
    overflow: "hidden",
  };

  const avatar: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    filter: "grayscale(1) brightness(1.25) contrast(1.5)",
  };

  const barOuter: CSSProperties = {
    height: 24,
    background: "#000",
    border: "2px solid #fff",
    width: "100%",
  };

  function BarRow({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
    const pct = (current / max) * 100;
    return (
      <div style={{ width: "100%", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4, fontFamily: "'Press Start 2P', cursive", color: "#fff" }}>
          <span>{label}</span>
          <span>{current}/{max}</span>
        </div>
        <div style={barOuter}>
          <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, transition: "width 0.6s ease" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={outer}>
      <div style={avatarFrame}>
        <img src={player.avatarUrl} alt="Student Sprite" style={avatar} />
      </div>

      <h1 style={{ fontSize: 14, color: C.yellow, textShadow: "3px 3px 0px #000", margin: "0 0 8px", fontFamily: "'Press Start 2P', cursive" }}>
        {player.name}
      </h1>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", margin: "0 0 16px", fontFamily: "'Press Start 2P', cursive" }}>
        {player.title}
      </p>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        <BarRow label="HP (Study)" current={player.hp.current} max={player.hp.max} color={C.red} />
        <BarRow label="MP (Focus)" current={player.mp.current} max={player.mp.max} color={C.blue} />
      </div>
    </div>
  );
}
