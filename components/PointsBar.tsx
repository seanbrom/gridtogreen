export function PointsBar({
  driver1,
  driver2,
  points1,
  points2,
}: {
  driver1: string;
  driver2: string;
  points1: number;
  points2: number;
}) {
  const total = points1 + points2;
  const pct1 = total > 0 ? Math.round((points1 / total) * 100) : 50;
  const pct2 = 100 - pct1;

  return (
    <div className="flex h-5 w-full overflow-hidden rounded text-[10px] font-medium">
      <div
        className="flex items-center justify-center bg-racing-red text-white"
        style={{ width: `${pct1}%` }}
      >
        {pct1 > 20 && `${driver1} ${points1}`}
      </div>
      <div
        className="flex items-center justify-center bg-secondary text-muted-foreground"
        style={{ width: `${pct2}%` }}
      >
        {pct2 > 20 && `${driver2} ${points2}`}
      </div>
    </div>
  );
}
