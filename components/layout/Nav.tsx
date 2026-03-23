import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl tracking-wide text-foreground">
            GRID TO GREEN
          </span>
          <span className="h-4 w-1 bg-racing-red" />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Latest
          </Link>
          <Link
            href="/archive"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Archive
          </Link>
        </nav>
      </div>
    </header>
  );
}
