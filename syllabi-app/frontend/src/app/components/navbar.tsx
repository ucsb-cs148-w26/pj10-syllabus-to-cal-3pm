"use client"; // required if you plan to add any interactivity

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-center gap-8">
      <Link href="/has_navbar/upload" className="hover:underline">
        Upload
      </Link>
      <Link href="/has_navbar/calendar" className="hover:underline">
        Calendar
      </Link>
      <Link href="/has_navbar/tasks" className="hover:underline">
        Tasks
      </Link>
      <Link href="/has_navbar/profile" className="hover:underline">
        Profile
      </Link>
      <Link href="/" className="hover:underline">
        Logout
      </Link>
    </nav>
  );
}
