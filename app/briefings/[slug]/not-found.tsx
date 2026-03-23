import Link from "next/link";

export default function BriefingNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <div className="text-center">
        <h1 className="font-heading text-5xl tracking-wide text-foreground">
          404
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          This briefing doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-racing-red px-6 text-sm font-medium text-white transition-colors hover:bg-racing-red/90"
        >
          Back to Latest
        </Link>
      </div>
    </div>
  );
}
