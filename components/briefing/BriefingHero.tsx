import Link from "next/link";
import type { Briefing } from "@/types";
import { findCircuitIdForBriefing } from "@/lib/circuits";

interface BriefingHeroProps {
  briefing: Briefing;
}

export function BriefingHero({ briefing }: BriefingHeroProps) {
  const circuitId = findCircuitIdForBriefing(briefing.circuit);
  const raceDate = new Date(briefing.raceDate);
  const formattedDate = raceDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative overflow-hidden border-b border-border/30">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-racing-red/8 via-background to-background" />
      <div className="scanline-overlay absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 md:pt-16">
        {/* Race info bar */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {briefing.briefingType === "cancelled" ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-muted-foreground/10 px-3 py-1 text-xs font-medium text-muted-foreground">
              CANCELLED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded bg-racing-red/10 px-3 py-1 text-xs font-medium text-racing-red">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-racing-red" />
              {briefing.briefingType === "preview" ? "PREVIEW" : "RACE BRIEFING"}
            </span>
          )}
          {circuitId ? (
            <Link href={`/circuits/${circuitId}`} className="font-mono text-xs transition-colors hover:text-foreground">
              {briefing.circuit}
            </Link>
          ) : (
            <span className="font-mono text-xs">{briefing.circuit}</span>
          )}
          <span className="text-border/40">|</span>
          {circuitId ? (
            <Link href={`/circuits/${circuitId}`} className="font-mono text-xs transition-colors hover:text-foreground">
              {briefing.location}, {briefing.country}
            </Link>
          ) : (
            <span className="font-mono text-xs">
              {briefing.location}, {briefing.country}
            </span>
          )}
        </div>

        {/* Race name */}
        <h1 className="mt-4 font-heading text-5xl tracking-wide text-foreground md:text-7xl lg:text-8xl">
          {briefing.raceName}
        </h1>
        <div
          className="mt-2 h-0.5 w-20 origin-left bg-racing-red md:w-28"
          style={{ animation: "stripe-extend 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        />

        {/* Date */}
        <p className="mt-3 font-mono text-xs text-muted-foreground/60">{formattedDate}</p>

        {/* Headline */}
        <p className="mt-6 max-w-3xl text-xl font-medium leading-relaxed text-foreground md:text-2xl">
          {briefing.headline}
        </p>

        {/* Summary */}
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {briefing.summary}
        </p>

        {/* Key Number */}
        <div className="mt-8 inline-flex flex-col overflow-hidden rounded-lg border border-border/40 bg-card">
          <div className="bg-racing-red/5 px-6 pt-5 pb-4">
            <span className="font-heading text-5xl tracking-wide text-racing-red md:text-6xl">
              {briefing.keyNumber.value}
            </span>
          </div>
          <div className="border-t border-border/30 px-6 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              {briefing.keyNumber.label}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
