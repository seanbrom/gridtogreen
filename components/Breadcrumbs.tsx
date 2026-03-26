import Link from "next/link";
import { getBaseUrl } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-4">
      <ol className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="contents">
              {i > 0 && <span aria-hidden="true">/</span>}
              {isLast ? (
                <span aria-current="page" className="text-foreground">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href ?? "/"}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Generate BreadcrumbList JSON-LD structured data. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.href
        ? `${baseUrl}${item.href}`
        : baseUrl,
    })),
  };
}
