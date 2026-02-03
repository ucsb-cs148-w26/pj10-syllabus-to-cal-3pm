"use client";

import { CSSProperties } from "react";
import { WeeklyClass } from "./gameData";
import { C, pixelBorder } from "./styles";

/* map the old material-symbol name → an emoji that actually renders */
const ICON_MAP: Record<string, string> = {
  shopping_basket: "🧪",
  key:            "🗝️",
  lock:           "🔒",
};

export default function WeeklyClasses({ classes }: { classes: WeeklyClass[] }) {
  const outer: CSSProperties = {
    ...pixelBorder,
    padding: 24,
  };

  const title: CSSProperties = {
    fontSize: 11,
    color: C.yellow,
    textTransform: "uppercase",
    margin: "0 0 20px",
    fontFamily: "'Press Start 2P', cursive",
    textShadow: "2px 2px 0px #000",
    letterSpacing: "0.04em",
  };

  const grid: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
  };

  return (
    <div style={outer}>
      <h2 style={title}>🎒 Classes Completed</h2>

      <div style={grid}>
        {classes.map((cls) => {
          const done = cls.status === "completed";
          const emoji = ICON_MAP[cls.icon] ?? "📚";

          const item: CSSProperties = {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            width: 76,
          };

          const iconBox: CSSProperties = {
            width: 64,
            height: 64,
            border: `3px solid ${done ? C.yellow : "rgba(255,255,255,0.18)"}`,
            borderRadius: 6,
            backgroundColor: done ? "rgba(255,204,0,0.08)" : "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            opacity: done ? 1 : 0.45,
            boxShadow: done ? `0 0 10px ${C.yellow}44` : "none",
            transition: "box-shadow 0.3s ease",
          };

          const label: CSSProperties = {
            fontSize: 7,
            textAlign: "center",
            lineHeight: 1.3,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            fontFamily: "'Press Start 2P', cursive",
            color: done ? "#fff" : "rgba(255,255,255,0.4)",
          };

          /* little sparkle badge top-right on completed */
          const sparkle: CSSProperties = {
            position: "absolute",
            top: -6,
            right: -6,
            fontSize: 14,
            lineHeight: 1,
          };

          return (
            <div key={cls.id} style={item}>
              <div style={iconBox}>
                <span style={{ fontSize: 28 }}>{emoji}</span>
                {done && <span style={sparkle}>✨</span>}
              </div>
              <span style={label}>{cls.code}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
