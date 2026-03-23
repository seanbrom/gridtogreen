"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <div className="text-center">
        <h1 className="font-heading text-4xl tracking-wide text-foreground">
          SOMETHING WENT WRONG
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center rounded-md bg-racing-red px-6 text-sm font-medium text-white transition-colors hover:bg-racing-red/90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
