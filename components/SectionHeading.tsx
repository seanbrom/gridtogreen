export function SectionHeading({
  title,
  annotation,
}: {
  title: string;
  annotation: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="font-heading text-2xl tracking-wide text-foreground">
        {title}
      </h2>
      <span className="font-mono text-[10px] tracking-wider text-muted-foreground/40">
        //&nbsp;{annotation}
      </span>
    </div>
  );
}
