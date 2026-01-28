"use client"; // required if you plan to add any interactivity

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-center gap-8">
      <Link href="/upload" className="hover:underline">
        Upload
      </Link>
      <Link href="/calendar" className="hover:underline">
        Calendar
      </Link>
      <Link href="/profile" className="hover:underline">
        Profile
      </Link>
    </nav>
  );
}
