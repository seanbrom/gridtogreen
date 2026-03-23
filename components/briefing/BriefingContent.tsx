import Markdown from "react-markdown";

interface BriefingSection {
  id: string;
  title: string;
  content: string;
}

interface BriefingContentProps {
  sections: BriefingSection[];
}

export function BriefingContent({ sections }: BriefingContentProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <article
          key={section.id}
          className="rounded-lg border border-border/60 bg-card p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="h-4 w-1 rounded-full bg-racing-red" />
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {section.title}
            </span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-foreground/90 prose-strong:text-foreground prose-p:leading-relaxed">
            <Markdown>{section.content}</Markdown>
          </div>
        </article>
      ))}
    </div>
  );
}
