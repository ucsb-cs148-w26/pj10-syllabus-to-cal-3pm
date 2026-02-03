"use client";

import { CSSProperties } from "react";

import WorldMap      from "../../components/profile/WorldMap";
import PlayerCard    from "../../components/profile/PlayerCard";
import StatsPanel    from "../../components/profile/StatsPanel";
import SideQuests    from "../../components/profile/SideQuests";
import WeeklyClasses from "../../components/profile/WeeklyClasses";
import StatusBar     from "../../components/profile/StatusBar";

import { player, stats, sideQuests, weeklyClasses, navLinks } from "../../components/profile/gameData";
import { brickBg } from "../../components/profile/styles";

/* responsive 2-col grid at ≥1024px — the only global CSS we need */
const PAGE_CSS = `
  @media (min-width: 1024px) {
    .sq-grid { grid-template-columns: 1fr 2fr !important; }
  }
`;

export default function ProfilePage() {
  const page: CSSProperties = {
    ...brickBg,
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "'Press Start 2P', cursive",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 16px",
  };

  const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 32,
    width: "100%",
    maxWidth: 1000,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      <div style={page}>
        <WorldMap player={player} />

        <div className="sq-grid" style={grid}>
          {/* left col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <PlayerCard player={player} />
            <StatsPanel stats={stats} />
          </div>

          {/* right col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <SideQuests quests={sideQuests} />
            <WeeklyClasses classes={weeklyClasses} />
          </div>
        </div>

        <StatusBar player={player} links={navLinks} />
      </div>
    </>
  );
}
