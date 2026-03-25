import type { Metadata } from "next";
import Link from "next/link";
import { CIRCUITS } from "@/lib/circuits";
import { getBaseUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "F1 Circuits",
  description:
    "Every Formula 1 circuit on the 2026 calendar. Race history, winners, pole conversion rates, and pre-race briefings for all 24 Grand Prix venues.",
  openGraph: {
    title: "F1 Circuits | Grid to Green",
    description:
      "Race history and stats for every circuit on the F1 calendar.",
  },
};

// Group circuits by region for better browsing
const REGIONS: { name: string; circuitIds: string[] }[] = [
  {
    name: "Europe",
    circuitIds: [
      "imola",
      "monaco",
      "catalunya",
      "red_bull_ring",
      "silverstone",
      "hungaroring",
      "spa",
      "zandvoort",
      "monza",
      "baku",
    ],
  },
  {
    name: "Middle East",
    circuitIds: ["bahrain", "jeddah", "losail", "yas_marina"],
  },
  {
    name: "Asia Pacific",
    circuitIds: ["suzuka", "shanghai", "marina_bay", "albert_park"],
  },
  {
    name: "Americas",
    circuitIds: ["villeneuve", "miami", "americas", "rodriguez", "interlagos", "vegas"],
  },
];

export default function CircuitsPage() {
  const baseUrl = getBaseUrl();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: baseUrl,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Circuits",
                item: `${baseUrl}/circuits`,
              },
            ],
          }),
        }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-4">
        <ol className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <li>
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            Circuits
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-7xl px-4 pt-8 pb-10">
        <h1 className="font-heading text-5xl tracking-wide text-foreground md:text-7xl">
          F1 <span className="text-terminal-green">CIRCUITS</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Race history, winners, and data for every circuit on the Formula 1
          calendar. Select a circuit to explore historical results and related
          briefings.
        </p>
        <div className="mt-4 h-0.5 w-20 bg-racing-red" />
      </header>

      {/* Circuit grid by region */}
      <div className="mx-auto max-w-7xl px-4 pb-16">
        <div className="space-y-12">
          {REGIONS.map((region) => {
            const circuits = region.circuitIds
              .map((id) => CIRCUITS.find((c) => c.circuitId === id))
              .filter(Boolean);

            return (
              <section key={region.name}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="font-heading text-2xl tracking-wide text-foreground">
                    {region.name.toUpperCase()}
                  </h2>
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground/40">
                    //&nbsp;{circuits.length}_CIRCUIT{circuits.length === 1 ? "" : "S"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {circuits.map((circuit) => (
                    <Link
                      key={circuit!.circuitId}
                      href={`/circuits/${circuit!.circuitId}`}
                      className="group relative block overflow-hidden rounded-lg border border-border/60 bg-card p-5 transition-all hover:border-racing-red/40 hover:shadow-[0_0_24px_rgba(232,0,45,0.08)]"
                    >
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-racing-red via-racing-red/60 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                        {circuit!.locality}, {circuit!.country}
                      </div>
                      <h3 className="mt-2 font-heading text-2xl tracking-wide text-foreground transition-colors group-hover:text-racing-red">
                        {circuit!.grandPrixName.replace(" Grand Prix", "")}
                        <span className="text-muted-foreground/30"> GP</span>
                      </h3>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
