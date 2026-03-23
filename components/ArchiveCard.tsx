import Link from "next/link";
import type { BriefingMeta } from "@/types";

interface ArchiveCardProps {
  meta: BriefingMeta;
}

export function ArchiveCard({ meta }: ArchiveCardProps) {
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
