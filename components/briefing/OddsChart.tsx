"use client";

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

interface OddsChartProps {
  oddsHistory: DriverPriceHistory[];
}

const LINE_COLORS = [
  "#7eb8e0", // light blue
  "#2563eb", // dark blue
  "#f59e0b", // amber
  "#f97316", // orange
  "#22c55e", // green
];

/**
 * Merge per-driver time series into a single row-based dataset
 * where each row has { time, VER: 45, NOR: 25, ... }.
 */
function buildChartData(drivers: DriverPriceHistory[]) {
  // Collect all unique timestamps
  const timeSet = new Set<number>();
  for (const driver of drivers) {
    for (const pt of driver.history) {
      timeSet.add(pt.t);
    }
  }

  const times = Array.from(timeSet).sort((a, b) => a - b);

  // Build lookup maps per driver (timestamp → probability %)
  const lookups = drivers.map((driver) => {
    const map = new Map<number, number>();
    for (const pt of driver.history) {
      map.set(pt.t, Math.round(pt.p * 1000) / 10); // e.g. 0.59 → 59.0
    }
    return map;
  });

  // Build rows, carrying forward the last known value for gaps
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

export function OddsChart({ oddsHistory }: OddsChartProps) {
  if (oddsHistory.length === 0) return null;

  const data = buildChartData(oddsHistory);
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-4 w-1 rounded-full bg-racing-red" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Market Movement
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Polymarket</span>
      </div>

      {/* Legend */}
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
                <span className="text-sm text-foreground">
                  {driver.driverName}
                </span>
              )}
              <span className="text-sm font-medium text-foreground">
                {Math.round(driver.currentProbability * 100)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-64 w-full md:h-80">
        <ResponsiveContainer width="100%" height="100%">
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
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
