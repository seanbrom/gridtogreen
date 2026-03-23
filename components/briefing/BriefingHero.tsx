import type { Briefing } from "@/types";

interface BriefingHeroProps {
  briefing: Briefing;
}

export function BriefingHero({ briefing }: BriefingHeroProps) {
  const raceDate = new Date(briefing.raceDate);
  const formattedDate = raceDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-racing-red/10 via-background to-background" />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 md:pt-16">
        {/* Race info */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-full bg-racing-red/10 px-3 py-1 text-xs font-medium text-racing-red">
            RACE BRIEFING
          </span>
          <span>{briefing.circuit}</span>
          <span className="text-border">|</span>
          <span>
            {briefing.location}, {briefing.country}
          </span>
        </div>

        {/* Race name */}
        <h1 className="mt-4 font-heading text-4xl tracking-wide text-foreground md:text-6xl lg:text-7xl">
          {briefing.raceName}
        </h1>

        {/* Date */}
        <p className="mt-2 text-sm text-muted-foreground">{formattedDate}</p>

        {/* Headline */}
        <p className="mt-6 max-w-3xl text-xl font-medium leading-relaxed text-foreground md:text-2xl">
          {briefing.headline}
        </p>

        {/* Summary */}
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {briefing.summary}
        </p>

        {/* Key Number */}
        <div className="mt-8 inline-flex flex-col rounded-lg border border-border/60 bg-card p-6">
          <span className="font-heading text-5xl tracking-wide text-racing-red md:text-6xl">
            {briefing.keyNumber.value}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">
            {briefing.keyNumber.label}
          </span>
        </div>
      </div>
    </section>
  );
}
