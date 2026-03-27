"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DriverPriceHistory } from "@/types";
import { getDriverByCode } from "@/lib/drivers";

interface ChampionshipOddsChartProps {
  oddsHistory: DriverPriceHistory[];
}

const LINE_COLORS = [
  "#7eb8e0",
  "#2563eb",
  "#f59e0b",
  "#f97316",
  "#22c55e",
];

function buildChartData(drivers: DriverPriceHistory[]) {
  const timeSet = new Set<number>();
  for (const driver of drivers) {
    for (const pt of driver.history) {
      timeSet.add(pt.t);
    }
  }

  const times = Array.from(timeSet).sort((a, b) => a - b);

  const lookups = drivers.map((driver) => {
    const map = new Map<number, number>();
    for (const pt of driver.history) {
      map.set(pt.t, Math.round(pt.p * 1000) / 10);
    }
    return map;
  });

  const lastValues = drivers.map(() => 0);
  return times.map((time) => {
    const row: Record<string, number> = { time };
    for (let i = 0; i < drivers.length; i++) {
      const val = lookups[i].get(time);
      if (val !== undefined) {
        lastValues[i] = val;
      }
      row[drivers[i].driverCode] = lastValues[i];
    }
    return row;
  });
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTooltipDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChampionshipOddsChart({ oddsHistory }: ChampionshipOddsChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (oddsHistory.length === 0) return null;

  const data = buildChartData(oddsHistory);
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-4 w-1 rounded-full bg-racing-red" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Drivers&apos; Championship Odds
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Polymarket</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        {oddsHistory.map((driver, i) => {
          const driverMeta = getDriverByCode(driver.driverCode);
          return (
            <div key={driver.driverCode} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
              />
              {driverMeta ? (
                <Link
                  href={`/drivers/${driverMeta.driverId}`}
                  className="text-sm text-foreground transition-colors hover:text-racing-red"
                >
                  {driver.driverName}
                </Link>
              ) : (
                <span className="text-sm text-foreground">{driver.driverName}</span>
              )}
              <span className="text-sm font-medium text-foreground">
                {Math.round(driver.currentProbability * 100)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-64 w-full md:h-80">
        {!mounted ? (
          <div className="h-full w-full" />
        ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="time"
              tickFormatter={formatDate}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={60}
            />
            <YAxis
              tickFormatter={(v: number) => `${v}%`}
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={45}
              domain={[0, "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              itemStyle={{ color: "var(--foreground)" }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              labelFormatter={(label) => formatTooltipDate(Number(label))}
              formatter={(value) => [`${value}%`]}
            />
            {oddsHistory.map((driver, i) => (
              <Line
                key={driver.driverCode}
                type="stepAfter"
                dataKey={driver.driverCode}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
                name={driver.driverName}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
