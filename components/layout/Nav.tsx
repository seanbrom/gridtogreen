"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Latest" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/drivers", label: "Drivers" },
  { href: "/teams", label: "Teams" },
  { href: "/circuits", label: "Circuits" },
  { href: "/archive", label: "Archive" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-heading text-2xl tracking-wider text-foreground">
            G<span className="text-terminal-green">2</span>G
          </span>
          <span className="h-4 w-0.5 bg-racing-red transition-all group-hover:h-5 group-hover:w-1" />
          <span className="hidden font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50 sm:inline">
            GRID_TO_GREEN
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? "relative text-foreground after:absolute after:-bottom-[17px] after:inset-x-0 after:h-0.5 after:bg-racing-red"
                    : "text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
