import { CSSProperties } from "react";

/* ─── Colour palette ─── */
export const C = {
  blue: "#0033cc",
  red: "#cc0000",
  yellow: "#ffcc00",
  green: "#00cc33",
  darkGreen: "#00aa22",
  darkBlue: "#000066",
  bg: "#1a1a1a",
  white: "#ffffff",
} as const;

/* ─── Reusable style fragments ─── */

/** The classic 16-bit raised-panel border */
export const pixelBorder: CSSProperties = {
  border: "4px solid #fff",
  boxShadow: "inset -4px -4px 0px 0px rgba(0,0,0,0.5), 4px 4px 0px 0px rgba(0,0,0,0.5)",
  backgroundColor: C.darkBlue,
};

/** Retro drop-shadow on headlines */
export const textShadowRetro: CSSProperties = {
  textShadow: "3px 3px 0px #000",
};

/** Brick-pattern background (applied to the page body wrapper) */
export const brickBg: CSSProperties = {
  backgroundColor: "#333",
  backgroundImage: [
    "linear-gradient(335deg, #222 23px, transparent 23px)",
    "linear-gradient(155deg, #222 23px, transparent 23px)",
    "linear-gradient(335deg, #222 23px, transparent 23px)",
    "linear-gradient(155deg, #222 23px, transparent 23px)",
  ].join(", "),
  backgroundSize: "58px 58px",
  backgroundPosition: "0px 2px, 4px 35px, 29px 31px, 34px 6px",
};

/** Dotted trail background used in the world-map bar */
export const worldMapTrail: CSSProperties = {
  backgroundImage: "radial-gradient(circle, #555 2px, transparent 2px)",
  backgroundSize: "20px 20px",
};
