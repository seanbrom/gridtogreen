/** Whether a driver completed the race (finished or lapped). */
export function isFinished(status: string): boolean {
  return status === "Finished" || status.startsWith("+");
}

/** Tailwind color class for a race finishing position. */
export function positionColor(position: number, finished: boolean): string {
  if (!finished) return "text-racing-red";
  if (position === 1) return "text-terminal-amber";
  if (position <= 3) return "text-terminal-green";
  return "text-foreground";
}
