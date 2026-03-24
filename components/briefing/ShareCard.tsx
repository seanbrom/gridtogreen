"use client";

import { useState } from "react";

interface ShareCardProps {
  slug: string;
  headline: string;
}

export function ShareCard({ slug, headline }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://gridtogreen.com";
  const url = `${baseUrl}/briefings/${slug}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Grid to Green: ${headline}`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${headline}\n\nRead the full race briefing:`)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-6">
      <span className="mb-4 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Share
      </span>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleShare}
          className="flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          Share Briefing
        </button>
        <button
          onClick={handleCopyLink}
          className="flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Post on X
        </a>
      </div>
    </div>
  );
}
