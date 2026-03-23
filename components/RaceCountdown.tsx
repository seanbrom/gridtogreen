"use client";

import { useEffect, useState } from "react";

interface RaceCountdownProps {
  raceDate: string;
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

export function RaceCountdown({ raceDate }: RaceCountdownProps) {
  const target = new Date(raceDate);
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
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Lights Out In
        </span>
        <div className="flex items-center gap-3">
          {units.map((unit) => (
            <div key={unit.label} className="flex items-baseline gap-1">
              <span className="font-heading text-2xl tabular-nums text-foreground">
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
