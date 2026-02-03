/* ─── Types ─── */

export interface PlayerData {
  name: string;
  level: number;
  title: string;
  avatarUrl: string;
  hp: { current: number; max: number };
  mp: { current: number; max: number };
  location: string;
  gp: number;
  currentWeek: number;
  totalWeeks: number;
}

export interface Stat {
  label: string;
  abbrev: string;
  value: number;
  /** "green" | "red" – controls accent colour */
  color: "green" | "red";
}

export interface SideQuest {
  id: string;
  courseName: string;
  courseCode: string;
  dueInDays: number;
  /** 0-100 */
  progress: number;
  /** true once progress === 100 */
  completed: boolean;
  /** "urgent" when dueInDays <= 2 */
  urgent: boolean;
}

export type ClassStatus = "completed" | "locked";

export interface WeeklyClass {
  id: string;
  code: string;
  icon: string; // Material Symbol name
  status: ClassStatus;
}

export interface NavLink {
  label: string;
  href: string;
  active: boolean;
}

/* ─── Seed Data ─── */

export const player: PlayerData = {
  name: "ALEXANDER",
  level: 24,
  title: "LVL 24 SCHOLAR",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBdwt1qbzM-yCdmJe2bh1oJtXpFBAN65DjmdGrt_FeF3QZ3HKGQoFl1MhyzMpXBV2mMyPNkWAgDPgLjvvI1A0d9zW4HcDUtPiNzD4xknO-NhMqTc1UX9K6aCdqYWcNEi-hAnlPbd6JUkJpE-kRjqssedwKcJU6fSsR0NvZKt67eREL6Q91XNSd89hCn4FfKUdf-Sl02LJdn_mlgtp7mTMK78sNwv3mF_hGNvN6zrF0IGRbX68dxAx-ifNq234UIHOjSyaoZs19zD0w4",
  hp: { current: 92, max: 100 },
  mp: { current: 74, max: 100 },
  location: "LIBRARY FLOOR 3",
  gp: 12450,
  currentWeek: 8,
  totalWeeks: 16,
};

export const stats: Stat[] = [
  { label: "Knowledge", abbrev: "INT", value: 28, color: "green" },
  { label: "Focus", abbrev: "DEX", value: 14, color: "green" },
  { label: "Deadlines", abbrev: "AGI", value: 9, color: "red" },
  { label: "Charisma", abbrev: "CHA", value: 12, color: "green" },
];

export const sideQuests: SideQuest[] = [
  {
    id: "chm-301",
    courseName: "Advanced Alchemy",
    courseCode: "CHM 301",
    dueInDays: 2,
    progress: 85,
    completed: true,
    urgent: true,
  },
  {
    id: "mat-202",
    courseName: "Arcane Vectors",
    courseCode: "MAT 202",
    dueInDays: 5,
    progress: 42,
    completed: false,
    urgent: false,
  },
  {
    id: "lit-101",
    courseName: "Ancient Scrolls",
    courseCode: "LIT 101",
    dueInDays: 12,
    progress: 15,
    completed: false,
    urgent: false,
  },
];

export const weeklyClasses: WeeklyClass[] = [
  { id: "chm-301", code: "CHM 301", icon: "shopping_basket", status: "completed" },
  { id: "mat-202", code: "MAT 202", icon: "key", status: "completed" },
  { id: "lit-101", code: "LIT 101", icon: "lock", status: "locked" },
  { id: "his-205", code: "HIS 205", icon: "lock", status: "locked" },
  { id: "bio-110", code: "BIO 110", icon: "lock", status: "locked" },
];

export const navLinks: NavLink[] = [
  { label: "DASHBOARD", href: "/dashboard", active: false },
  { label: "PROFILE", href: "/profile", active: true },
  { label: "SKILLS", href: "/skills", active: false },
  { label: "OPTIONS", href: "/options", active: false },
];
