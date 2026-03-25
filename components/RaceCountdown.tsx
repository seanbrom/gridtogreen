"use client";

import { useEffect, useState } from "react";

interface RaceCountdownProps {
  raceDate: string;
  raceStartTime?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function RaceCountdown({ raceDate, raceStartTime }: RaceCountdownProps) {
  const target = new Date(raceStartTime ?? raceDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calcTimeLeft(target)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [raceDate]);

  if (!timeLeft) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-racing-red/10 px-4 py-2 text-sm font-medium text-racing-red">
          <span className="h-2 w-2 rounded-full bg-racing-red animate-pulse" />
          RACE COMPLETE
        </div>
      </div>
    );
  }

  const units = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HRS", value: timeLeft.hours },
    { label: "MIN", value: timeLeft.minutes },
    { label: "SEC", value: timeLeft.seconds },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-racing-red" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Lights Out
          </span>
        </div>
        <div className="flex items-center gap-1">
          {units.map((unit, i) => (
            <div key={unit.label} className="flex items-center gap-1">
              <div className="flex flex-col items-center rounded border border-border/40 bg-card/80 px-3 py-1.5">
                <span className="font-heading text-2xl tabular-nums leading-none text-foreground md:text-3xl">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="mt-0.5 font-mono text-[8px] tracking-wider text-muted-foreground/60">
                  {unit.label}
                </span>
              </div>
              {i < units.length - 1 && (
                <span className="px-0.5 font-heading text-lg text-muted-foreground/30">:</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
