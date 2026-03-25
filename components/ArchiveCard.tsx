import Link from "next/link";
import type { BriefingMeta } from "@/types";

interface ArchiveCardProps {
  meta: BriefingMeta;
  showPreviewBadge?: boolean;
}

export function ArchiveCard({ meta, showPreviewBadge }: ArchiveCardProps) {
  const raceDate = new Date(meta.raceDate);
  const formattedDate = raceDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/briefings/${meta.slug}`}
      className="group relative block overflow-hidden rounded-lg border border-border/60 bg-card p-6 transition-all hover:border-racing-red/40 hover:shadow-[0_0_24px_rgba(232,0,45,0.08)]"
    >
      {/* Red top accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-racing-red via-racing-red/60 to-transparent transition-opacity group-hover:opacity-100 opacity-60" />

      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground/70">
        <span>{meta.location}</span>
        <span className="text-border/50">/</span>
        <span className="tabular-nums">{formattedDate}</span>
        {showPreviewBadge && (
          <>
            <span className="text-border/50">/</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-racing-red/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-racing-red">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-racing-red" />
              Preview
            </span>
          </>
        )}
      </div>

      <h3 className="mt-3 font-heading text-2xl tracking-wide text-foreground transition-colors group-hover:text-racing-red">
        {meta.raceName}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {meta.headline}
      </p>

      {meta.keyNumber && (
        <div className="mt-4 flex items-baseline gap-2 border-t border-border/30 pt-3">
          <span className="font-heading text-2xl text-racing-red">
            {meta.keyNumber.value}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/60">
            {meta.keyNumber.label}
          </span>
        </div>
      )}
    </Link>
  );
}
