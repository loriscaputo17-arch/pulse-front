"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur border-b border-zinc-800 bg-black/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight"
          onClick={() => setOpen(false)}
        >
          Pulse<span className="text-violet-500">.</span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <Link href="#features" className="hover:text-white transition">
            Features
          </Link>
          <Link href="#stats" className="hover:text-white transition">
            Analytics
          </Link>
          <Link href="#showcase" className="hover:text-white transition">
            Preview
          </Link>
        </div>

        {/* Desktop CTA */}
        <Link
          href="/login"
          className="hidden md:inline-flex px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition text-sm font-medium"
        >
          Login
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col justify-center items-center gap-1"
        >
          <span
            className={`h-0.5 w-6 bg-white transition ${
              open ? "rotate-45 translate-y-1.5" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition ${
              open ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-black/95 backdrop-blur border-t border-zinc-800">
          <div className="px-6 py-6 flex flex-col gap-6 text-zinc-300">

            <Link
              href="#features"
              onClick={() => setOpen(false)}
              className="hover:text-white transition"
            >
              Features
            </Link>

            <Link
              href="#stats"
              onClick={() => setOpen(false)}
              className="hover:text-white transition"
            >
              Analytics
            </Link>

            <Link
              href="#showcase"
              onClick={() => setOpen(false)}
              className="hover:text-white transition"
            >
              Preview
            </Link>

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex justify-center px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition font-medium text-white"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
