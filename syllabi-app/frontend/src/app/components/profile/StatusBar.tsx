"use client";

import { useState, CSSProperties } from "react";
import { PlayerData, NavLink } from "./gameData";
import { C, pixelBorder } from "./styles";

export default function StatusBar({ player, links }: { player: PlayerData; links: NavLink[] }) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const outer: CSSProperties = {
    ...pixelBorder,
    padding: 16,
    backgroundColor: "#000",
    width: "100%",
    maxWidth: 1000,
    marginTop: 32,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  };

  const leftInfo: CSSProperties = {
    display: "flex",
    gap: 16,
  };

  const navRow: CSSProperties = {
    display: "flex",
    gap: 24,
  };

  return (
    <div style={outer}>
      <div style={leftInfo}>
        <span style={{ fontSize: 10, color: C.yellow, fontFamily: "'Press Start 2P', cursive" }}>
          GP: {player.gp.toLocaleString()}
        </span>
        <span style={{ fontSize: 10, color: "#fff", fontFamily: "'Press Start 2P', cursive" }}>
          LOCATION: {player.location}
        </span>
      </div>

      <nav style={navRow}>
        {links.map((link) => {
          const isActive = link.active;
          const isHov   = hoveredLink === link.label;
          return (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: 10,
                fontFamily: "'Press Start 2P', cursive",
                color: isActive || isHov ? C.yellow : "#fff",
                textDecoration: "none",
                transition: "color 0.15s ease",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredLink(link.label)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {link.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
