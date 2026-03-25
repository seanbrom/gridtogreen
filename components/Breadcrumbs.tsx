import Link from "next/link";

interface BreadcrumbsProps {
  raceName: string;
}

export function Breadcrumbs({ raceName }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-4">
      <ol className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <li>
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            href="/archive"
            className="transition-colors hover:text-foreground"
          >
            Briefings
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-foreground">
          {raceName}
        </li>
      </ol>
    </nav>
  );
}
