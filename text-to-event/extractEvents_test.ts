import { extractEvents } from "./extractEvents.ts";

const blocks = [
  { text: "Homework 1 due Jan 12 at 11:59pm" },
  { text: "Midterm Exam: Feb 3" },
  { text: "Final Exam March 20 8:00 AM" },
];

const events = extractEvents(blocks);
console.log(events);
