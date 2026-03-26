// 2026 F1 constructor/team metadata for programmatic team pages

export interface TeamMeta {
  teamId: string;       // Jolpica constructor ID
  name: string;         // Display name
  fullName: string;     // Official team name
  base: string;         // HQ location
  country: string;
}

export const TEAMS_META: TeamMeta[] = [
  { teamId: "red_bull", name: "Red Bull Racing", fullName: "Oracle Red Bull Racing", base: "Milton Keynes", country: "UK" },
  { teamId: "mclaren", name: "McLaren", fullName: "McLaren Formula 1 Team", base: "Woking", country: "UK" },
  { teamId: "ferrari", name: "Ferrari", fullName: "Scuderia Ferrari HP", base: "Maranello", country: "Italy" },
  { teamId: "mercedes", name: "Mercedes", fullName: "Mercedes-AMG Petronas Formula One Team", base: "Brackley", country: "UK" },
  { teamId: "aston_martin", name: "Aston Martin", fullName: "Aston Martin Aramco Formula One Team", base: "Silverstone", country: "UK" },
  { teamId: "alpine", name: "Alpine", fullName: "BWT Alpine Formula One Team", base: "Enstone", country: "UK" },
  { teamId: "haas", name: "Haas", fullName: "MoneyGram Haas F1 Team", base: "Kannapolis", country: "USA" },
  { teamId: "rb", name: "RB", fullName: "Visa Cash App RB Formula One Team", base: "Faenza", country: "Italy" },
  { teamId: "williams", name: "Williams", fullName: "Williams Racing", base: "Grove", country: "UK" },
  { teamId: "sauber", name: "Kick Sauber", fullName: "Stake F1 Team Kick Sauber", base: "Hinwil", country: "Switzerland" },
  { teamId: "cadillac", name: "Cadillac", fullName: "Cadillac Formula 1 Team", base: "Indianapolis", country: "USA" },
];

export function getTeamMeta(teamId: string): TeamMeta | undefined {
  return TEAMS_META.find((t) => t.teamId === teamId);
}

export function getTeamByName(name: string): TeamMeta | undefined {
  return TEAMS_META.find(
    (t) => t.name === name || t.fullName === name
  );
}
