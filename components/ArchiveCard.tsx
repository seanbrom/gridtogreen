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
      className="group block rounded-lg border border-border/60 bg-card p-6 transition-all hover:border-racing-red/40 hover:bg-card/80"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{meta.location}</span>
        <span className="text-border">|</span>
        <span>{formattedDate}</span>
        {showPreviewBadge && (
          <>
            <span className="text-border">|</span>
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

      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
        {meta.headline}
      </p>

      {meta.keyNumber && (
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-heading text-2xl text-racing-red">
            {meta.keyNumber.value}
          </span>
          <span className="text-xs text-muted-foreground">
            {meta.keyNumber.label}
          </span>
        </div>
      )}
    </Link>
  );
}
