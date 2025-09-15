
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Dream = {
  id: string;      // random id
  date: string;    // "YYYY-MM-DD" (LOCAL date)
  text: string;
  symbol: string;  // emoji
};

const STORAGE_KEY = "dream-nook:entries";

// Local date helper (avoid UTC off-by-one)
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Expanded dream emoji palette (~180)
const SYMBOLS = [
  // Night & sky
  "🌙","⭐","🌟","✨","🌌","🌠","☁️","🌤️","🌥️","⛅","🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘","🌚","🌛","🌜","🌞","🌈",
  // Nature & elements
  "🔥","💧","🌊","⛰️","🏔️","🌋","🌪️","🌀","🍃","🍂","🍁","🌿","🌱","🌳","🌲","🌴","🌵","🌸","🌼","🌻","🌹","🌺","🥀","🌷","🪻","🌾",
  // Animals & dreamlike creatures
  "🦋","🐝","🐞","🐌","🦄","🐉","🐲","🦉","🦇","🦢","🐚","🐠","🐟","🐬","🐳","🐋","🦈","🪼","🦑","🦐","🦞","🦂","🕷️","🕸️",
  // Mystical & objects
  "🔮","🪄","🪐","👁️","🪞","⏳","🕰️","⌛","📜","📖","📚","🗝️","🛡️","⚔️","🪶","🕯️","💎","💠","🔷","🔶","🔺","🔻",
  // Places & structures
  "🏰","🏯","🏝️","🏜️","🌁","🌉","🛖","🕋","🏛️","🛕","🕍","⛩️","⛪","🗿",
  // Celestial & cosmic
  "🚀","🛸","🛰️","☄️","🌍","🌎","🌏","💫",
  // Sleep & cozy
  "🛏️","🛋️","🪑","🧸","🛌","💤","😴","🛎️",
  // Symbols & feelings
  "💭","❤️","🖤","💜","💙","💚","💛","🧡","🤍","💗","💓","💞","💕","❣️","💔","⚡","☮️","☯️","♾️","✴️","✡️","☪️","☦️","🕉️","☸️","✝️","⛎"
];

export default function HomePage() {
  const [text, setText] = useState("");
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [message, setMessage] = useState("");
  const [showMsg, setShowMsg] = useState(false);

  // emoji picker UI
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // close picker on outside click / Esc
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDreams(JSON.parse(raw));
    } catch {}
  }, []);

  // save to localStorage whenever dreams change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
    } catch {}
  }, [dreams]);

  // add new dream (multiple per day allowed) — using LOCAL date
  const addDream = () => {
    if (!text.trim()) return;
    const today = ymdLocal(new Date()); // LOCAL date

    const newDream: Dream = {
      id: Math.random().toString(36).slice(2, 9),
      date: today,
      text: text.trim(),
      symbol,
    };

    // Update state (then effect persists to localStorage)
    setDreams((prev) => [newDream, ...prev]);
    setText("");

    // confirmation message
    setMessage("captured ✨");
    setShowMsg(true);
    setTimeout(() => setShowMsg(false), 1600);
    setTimeout(() => setMessage(""), 2200);
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        {/* Title + subtitle */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Dream Nook 🌙</h1>
          <p className="text-gray-600 text-base mt-2 text-center leading-snug">
            capture the dream before it fades. just a fragment and a symbol.
          </p>
        </div>

        {/* Input row */}
        <div className="flex gap-2 mb-2 items-center">
          {/* Dream text */}
          <textarea
            placeholder="Pink bike, childhood home..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            className="flex-1 border rounded p-2 text-sm resize-none"
          />

          {/* Emoji picker trigger + popover */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              aria-label="Choose symbol"
              onClick={() => setPickerOpen((v) => !v)}
              className="border rounded px-3 h-9 text-lg leading-none flex items-center gap-1"
            >
              <span>{symbol}</span>
              <span className="text-xs">▼</span>
            </button>

            {pickerOpen && (
              <div
                className="absolute right-0 mt-2 z-10 w-64 max-h-64 overflow-y-auto rounded-lg border bg-white p-2 shadow-lg"
                role="dialog"
                aria-label="Emoji picker"
              >
                <div className="grid grid-cols-6 gap-1">
                  {SYMBOLS.map((s) => (
                    <button
                      key={s}
                      className={`h-9 w-9 rounded hover:bg-indigo-50 text-xl leading-none ${
                        s === symbol ? "ring-2 ring-indigo-300" : ""
                      }`}
                      onClick={() => {
                        setSymbol(s);
                        setPickerOpen(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <button
            onClick={addDream}
            className="bg-indigo-600 text-white rounded px-3 py-1 text-sm h-9"
          >
            Save
          </button>
        </div>

        {/* Confirmation message (soft blue, fades out) */}
        <div
          className={`text-sky-500 text-sm mt-1 text-right transition-all duration-500 ${
            showMsg ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}
        >
          {message}
        </div>

        {/* Right-aligned link (use next/link) */}
        <div className="text-right mt-2">
          <Link href="/calendar" className="text-indigo-600 underline text-sm">
            view all dreams →
          </Link>
        </div>
      </div>
    </main>
  );
}