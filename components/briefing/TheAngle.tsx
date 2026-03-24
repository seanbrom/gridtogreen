import Markdown from "react-markdown";

interface TheAngleProps {
  content: string;
  polymarketUrl: string;
}

export function TheAngle({ content, polymarketUrl }: TheAngleProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <article className="rounded-lg border border-racing-red/30 bg-gradient-to-b from-racing-red/5 to-card p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-6 w-1.5 rounded-full bg-racing-red" />
          <h2 className="font-heading text-2xl tracking-wide text-foreground md:text-3xl">
            THE ANGLE
          </h2>
        </div>

        <div className="prose prose-invert max-w-none text-base text-foreground/90 prose-strong:text-foreground prose-p:text-lg prose-p:leading-relaxed md:prose-p:text-xl">
          <Markdown>{content}</Markdown>
        </div>

        <div className="mt-6 border-t border-border/40 pt-6">
          <a
            href={polymarketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-racing-red/40 bg-racing-red/10 px-5 py-2.5 text-sm font-medium text-racing-red transition-colors hover:bg-racing-red/20"
          >
            Trade this race on Polymarket
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </article>
    </div>
  );
}
