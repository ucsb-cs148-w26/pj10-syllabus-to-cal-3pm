"use client";

import { CSSProperties } from "react";
import { PlayerData } from "./gameData";
import { C, pixelBorder, textShadowRetro, worldMapTrail } from "./styles";

const BOUNCE_CSS = `
@keyframes sq-bounce {
  0%, 100% { transform: translateX(-50%) translateY(-50%); }
  50%      { transform: translateX(-50%) translateY(calc(-50% - 14px)); }
}
`;

/* little 16×16 pixel-art walking dude, white */
const PlayerSVG = () => (
  <svg width="28" height="36" viewBox="0 0 16 20" style={{ imageRendering: "pixelated" }}>
    {/* head */}
    <rect x="6" y="0" width="4" height="4" fill={C.yellow}/>
    {/* body */}
    <rect x="5" y="4" width="6" height="6" fill="#fff"/>
    {/* left arm */}
    <rect x="3" y="5" width="2" height="5" fill="#fff"/>
    {/* right arm */}
    <rect x="11" y="5" width="2" height="5" fill="#fff"/>
    {/* left leg */}
    <rect x="5" y="10" width="2" height="5" fill="#fff"/>
    {/* right leg */}
    <rect x="9" y="10" width="2" height="5" fill="#fff"/>
  </svg>
);

/* small pixel skull */
const SkullSVG = () => (
  <svg width="32" height="32" viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
    <rect x="3" y="2" width="10" height="8" fill={C.red}/>
    <rect x="2" y="4" width="1" height="4" fill={C.red}/>
    <rect x="13" y="4" width="1" height="4" fill={C.red}/>
    {/* eyes */}
    <rect x="5" y="5" width="2" height="3" fill="#000"/>
    <rect x="9" y="5" width="2" height="3" fill="#000"/>
    {/* jaw */}
    <rect x="4" y="10" width="8" height="3" fill={C.red}/>
    {/* teeth gaps */}
    <rect x="5" y="11" width="1" height="2" fill="#000"/>
    <rect x="7" y="11" width="2" height="2" fill="#000"/>
    <rect x="10" y="11" width="1" height="2" fill="#000"/>
  </svg>
);

export default function WorldMap({ player }: { player: PlayerData }) {
  const pct = (player.currentWeek / player.totalWeeks) * 100;

  const outer: CSSProperties = {
    ...pixelBorder,
    padding: 24,
    marginBottom: 32,
    width: "100%",
    maxWidth: 1000,
  };

  const header: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  };

  const trail: CSSProperties = {
    ...worldMapTrail,
    position: "relative",
    width: "100%",
    height: 64,
    borderBottom: "4px dashed rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
  };

  const centerLine: CSSProperties = {
    position: "absolute",
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: "50%",
    transform: "translateY(-50%)",
  };

  const completedTrail: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    height: 4,
    width: `${pct}%`,
    background: `linear-gradient(90deg, ${C.yellow}88, ${C.yellow}cc)`,
  };

  const playerWrapper: CSSProperties = {
    position: "absolute",
    left: `${pct}%`,
    top: "50%",
    transform: "translateX(-50%) translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "sq-bounce 1s infinite",
    zIndex: 2,
  };

  const playerLabel: CSSProperties = {
    fontSize: 7,
    backgroundColor: "#000",
    padding: "2px 5px",
    border: "2px solid #fff",
    marginTop: 2,
    fontFamily: "'Press Start 2P', cursive",
    color: "#fff",
    whiteSpace: "nowrap",
  };

  const skullWrapper: CSSProperties = {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BOUNCE_CSS }} />
      <div style={outer}>
        <div style={header}>
          <h2 style={{ ...textShadowRetro, fontSize: 12, textTransform: "uppercase", letterSpacing: "-0.05em", color: C.yellow, margin: 0, fontFamily: "'Press Start 2P', cursive" }}>
            World Map: Semester Trail
          </h2>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "'Press Start 2P', cursive" }}>
            Week {player.currentWeek} / {player.totalWeeks}
          </span>
        </div>

        <div style={trail}>
          <div style={centerLine} />
          <div style={completedTrail} />

          <div style={playerWrapper}>
            <PlayerSVG />
            <span style={playerLabel}>PLAYER</span>
          </div>

          <div style={skullWrapper}>
            <SkullSVG />
          </div>
        </div>
      </div>
    </>
  );
}
