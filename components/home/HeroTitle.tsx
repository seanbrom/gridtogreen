export function HeroTitle() {
  return (
    <div className="relative">
      {/* Title */}
      <h1 className="font-heading text-6xl leading-[0.85] tracking-wider text-foreground md:text-8xl lg:text-[10rem]">
        GRID TO
        <br />
        <span className="text-terminal-green">GREEN</span>
      </h1>

      {/* Animated red racing stripe */}
      <div
        className="mt-3 h-1 w-24 origin-left bg-racing-red md:w-32"
        style={{ animation: "stripe-extend 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      />

      {/* Terminal tagline */}
      <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 md:text-xs">
        <span className="text-racing-red/60">SYS</span>
        <span className="text-border">:</span>
        GRID_TO_GREEN{" "}
        <span className="text-border">//</span>{" "}
        YOUR PRE-RACE BRIEFING // EVERY GP
        <span
          className="ml-1 inline-block h-3 w-1.5 bg-racing-red/80 align-middle"
          style={{ animation: "cursor-blink 1s step-end infinite" }}
        />
      </div>

      {/* Explainer text */}
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
        The pre-race read for anyone who wants more than gut feelings.{" "}
        <span className="text-foreground">Prediction markets</span>,{" "}
        <span className="text-foreground">telemetry</span>,{" "}
        <span className="text-foreground">five years of circuit data</span>,
        and{" "}
        <span className="text-foreground">weather</span>.
        Synthesized into a briefing that takes a side.
      </p>
    </div>
  );
}
