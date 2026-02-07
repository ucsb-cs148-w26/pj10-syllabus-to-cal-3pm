"use client";

import { CSSProperties } from "react";
import { Stat } from "./gameData";
import { C, pixelBorder } from "./styles";

export default function StatsPanel({ stats }: { stats: Stat[] }) {
  const outer: CSSProperties = {
    ...pixelBorder,
    padding: 16,
  };

  const title: CSSProperties = {
    fontSize: 10,
    color: C.yellow,
    textTransform: "uppercase",
    margin: "0 0 16px",
    fontFamily: "'Press Start 2P', cursive",
  };

  const row: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 10,
    fontFamily: "'Press Start 2P', cursive",
    color: "#fff",
  };

  return (
    <div style={outer}>
      <h3 style={title}>Student Stats</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {stats.map((s) => (
          <div key={s.abbrev} style={row}>
            <span>
              {s.label} <span style={{ color: "rgba(255,255,255,0.5)" }}>({s.abbrev})</span>
            </span>
            <span style={{ color: s.color === "green" ? C.green : C.red }}>
              {String(s.value).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
