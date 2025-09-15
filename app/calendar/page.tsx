"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Dream = {
  id: string;      // random id
  date: string;    // "YYYY-MM-DD" (LOCAL date)
  text: string;
  symbol: string;  // emoji
};

const STORAGE_KEY = "dream-nook:entries";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---- helpers ----
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function daysInMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

export default function CalendarPage() {
  // 1) Load & keep in sync with localStorage
  const [dreams, setDreams] = useState<Dream[]>([]);

  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setDreams(raw ? JSON.parse(raw) : []);
    } catch {
      setDreams([]);
    }
  };

  useEffect(() => {
    // initial load
    loadFromStorage();

    // update when storage changes (other tabs / same tab sometimes)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadFromStorage();
    };
    window.addEventListener("storage", onStorage);

    // update when tab regains focus (Safari / Next.js navigation quirks)
    const onFocus = () => loadFromStorage();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") loadFromStorage();
    });

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // 2) Month state & math
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0..11

  const firstOfMonth = useMemo(() => new Date(year, month, 1), [year, month]);
  const leadingBlanks = firstOfMonth.getDay();
  const totalDays = daysInMonth(year, month);
  const todayStr = ymdLocal(new Date());

  function prevMonth() {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() - 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }
  function nextMonth() {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }
  function jumpToToday() {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  // 3) Group by date (supports multiple entries per day)
  const dreamsByDate = useMemo(() => {
    const map = new Map<string, Dream[]>();
    for (const d of dreams) {
      const list = map.get(d.date) ?? [];
      list.push(d); // newest first if you prepend on save
      map.set(d.date, list);
    }
    return map;
  }, [dreams]);

  // 4) Modal state & delete
  const [openDate, setOpenDate] = useState<string | null>(null);
  const openList = openDate ? dreamsByDate.get(openDate) ?? [] : [];

  const deleteDream = (id: string) => {
    setDreams((prev) => {
      const next = prev.filter((d) => d.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); // persist immediately
      // if last of the day removed, close modal
      if (openDate && !next.some((d) => d.date === openDate)) setOpenDate(null);
      return next;
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-gray-600 hover:underline">← back</Link>

          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="px-2 py-1 border rounded">◀</button>
            <h1 className="text-lg sm:text-xl font-semibold">
              {firstOfMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </h1>
            <button onClick={nextMonth} className="px-2 py-1 border rounded">▶</button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={jumpToToday} className="text-sm text-indigo-600 underline">
              today
            </button>
            <button
              onClick={loadFromStorage}
              className="text-sm px-2 py-1 border rounded"
              title="Reload from local storage"
            >
              refresh
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 text-center text-xs sm:text-sm text-gray-600 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* leading blanks */}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`b-${i}`} className="h-20 rounded border border-dashed border-gray-200" />
          ))}

          {/* days */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const dateStr = ymdLocal(new Date(year, month, day));
            const list = dreamsByDate.get(dateStr) || [];
            const latest = list[0];
            const isToday = dateStr === todayStr;

            return (
              <button
                key={dateStr}
                onClick={() => list.length && setOpenDate(dateStr)}
                title={latest ? latest.text : ""}
                className={`h-20 rounded border flex flex-col items-center justify-between p-2 hover:shadow-sm
                  ${list.length ? "border-indigo-300 bg-indigo-50" : "border-gray-200"}
                  ${isToday ? "ring-2 ring-indigo-300" : ""}`}
              >
                <div className="w-full text-left text-[10px] text-gray-500">{day}</div>

                <div className="flex items-center gap-1">
                  <div className="text-2xl leading-none">
                    {latest ? latest.symbol : "·"}
                  </div>
                  {list.length > 1 && (
                    <span className="text-[10px] px-1 rounded bg-indigo-100 text-indigo-700">
                      +{list.length - 1}
                    </span>
                  )}
                </div>

                <div className="h-4" />
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Tip: click a day with a symbol to read or remove fragments.
        </div>

        {/* Modal */}
        {openDate && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-lg p-4 shadow-lg">
              <div className="flex items-start justify-between">
                <div /> {/* no big date */}
                <button onClick={() => setOpenDate(null)} className="text-gray-600">✕</button>
              </div>

              {openList.length === 0 ? (
                <p className="mt-2 text-gray-600">No entries for this day.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {openList.map((d) => (
                    <li key={d.id} className="border rounded p-2 text-sm group relative">
                      {/* Symbol + text */}
                      <div className="flex items-start gap-2">
                        <div className="text-lg">{d.symbol}</div>
                        <p className="whitespace-pre-wrap flex-1">{d.text}</p>
                      </div>

                      {/* "remove" (hover) with confirm */}
                      <button
                        onClick={() => {
                          if (confirm("Confirm you want to remove this dream?")) {
                            deleteDream(d.id);
                          }
                        }}
                        className="absolute top-2 right-2 text-xs text-gray-400 underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        remove
                      </button>

                      {/* Date bottom-right */}
                      <div className="mt-2 text-xs text-gray-500 text-right">
                        {new Date(d.date).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}