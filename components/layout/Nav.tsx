"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Latest" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/archive", label: "Archive" },
];

export function Nav() {
  const pathname = usePathname();

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
                    ? "text-foreground"
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
