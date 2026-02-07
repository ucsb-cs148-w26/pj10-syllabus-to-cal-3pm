"use client";

import { useState, CSSProperties } from "react";
import { SideQuest } from "./gameData";
import { C, pixelBorder } from "./styles";

function progressColor(p: number) {
  if (p >= 80) return C.green;
  if (p >= 40) return C.yellow;
  return C.red;
}

export default function SideQuests({ quests }: { quests: SideQuest[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const outer: CSSProperties = {
    ...pixelBorder,
    padding: 24,
    flex: 1,
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

  function QuestRow({ quest }: { quest: SideQuest }) {
    const isHov = hovered === quest.id;

    const row: CSSProperties = {
      padding: "14px 18px",
      border: `2px solid ${isHov ? C.yellow : "rgba(255,255,255,0.15)"}`,
      borderRadius: 4,
      backgroundColor: isHov ? "rgba(255,204,0,0.06)" : "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      opacity: quest.progress <= 20 ? 0.55 : 1,
      transition: "border-color 0.2s ease, background-color 0.2s ease",
      cursor: "default",
    };

    /* thin left-edge accent bar colour-coded by progress */
    const accent: CSSProperties = {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: progressColor(quest.progress),
      borderRadius: "4px 0 0 4px",
    };

    /* mini pixel progress bar */
    const barTrack: CSSProperties = {
      width: 64,
      height: 6,
      backgroundColor: "#000",
      border: "1px solid rgba(255,255,255,0.3)",
      marginTop: 6,
    };

    const barFill: CSSProperties = {
      height: "100%",
      width: `${quest.progress}%`,
      backgroundColor: progressColor(quest.progress),
      transition: "width 0.4s ease",
    };

    return (
      <div style={{ position: "relative" }} onMouseEnter={() => setHovered(quest.id)} onMouseLeave={() => setHovered(null)}>
        <div style={accent} />
        <div style={row}>
          {/* left – course info */}
          <div>
            <p style={{ fontSize: 10, margin: 0, fontFamily: "'Press Start 2P', cursive", color: "#fff" }}>
              {quest.courseName}{" "}
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 8 }}>({quest.courseCode})</span>
            </p>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", margin: "5px 0 0", fontFamily: "'Press Start 2P', cursive" }}>
              Due: {quest.dueInDays} Day{quest.dueInDays !== 1 ? "s" : ""}
              {quest.urgent && (
                <span style={{ color: C.red, marginLeft: 6, fontWeight: 700 }}>⚡ URGENT</span>
              )}
            </p>
            {/* progress bar */}
            <div style={barTrack}>
              <div style={barFill} />
            </div>
          </div>

          {/* right – percentage badge */}
          <div style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            border: `2px solid ${progressColor(quest.progress)}`,
            borderRadius: 4,
            padding: "4px 10px",
            minWidth: 44,
            textAlign: "center",
          }}>
            <span style={{ fontSize: 11, color: progressColor(quest.progress), fontFamily: "'Press Start 2P', cursive" }}>
              {quest.progress}<span style={{ fontSize: 7 }}>%</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  const btnBase: CSSProperties = {
    ...pixelBorder,
    padding: "14px 0",
    fontSize: 10,
    fontFamily: "'Press Start 2P', cursive",
    color: "#fff",
    border: "4px solid #fff",
    cursor: "pointer",
    transition: "filter 0.15s ease, transform 0.1s ease",
    letterSpacing: "0.08em",
  };

  return (
    <div style={outer}>
      <h2 style={title}>⚔️ Active Side-Quests</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {quests.map((q) => <QuestRow key={q.id} quest={q} />)}
      </div>

      {/* buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 28 }}>
        <button style={{ ...btnBase, backgroundColor: C.red }}
          onMouseEnter={e => { (e.currentTarget).style.filter = "brightness(1.25)"; }}
          onMouseLeave={e => { (e.currentTarget).style.filter = "brightness(1)"; }}
          onMouseDown={e => { (e.currentTarget).style.transform = "translateY(2px)"; }}
          onMouseUp={e => { (e.currentTarget).style.transform = "translateY(0)"; }}
        >LOG OUT</button>
        <button style={{ ...btnBase, backgroundColor: C.blue }}
          onMouseEnter={e => { (e.currentTarget).style.filter = "brightness(1.25)"; }}
          onMouseLeave={e => { (e.currentTarget).style.filter = "brightness(1)"; }}
          onMouseDown={e => { (e.currentTarget).style.transform = "translateY(2px)"; }}
          onMouseUp={e => { (e.currentTarget).style.transform = "translateY(0)"; }}
        >🎒 EQUIPMENT</button>
      </div>
    </div>
  );
}
