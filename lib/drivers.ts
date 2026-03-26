// 2026 F1 driver grid metadata for programmatic driver pages

export interface DriverMeta {
  driverId: string;    // Jolpica/Ergast ID
  code: string;        // 3-letter abbreviation
  firstName: string;
  lastName: string;
  team: string;
  teamId: string;      // Jolpica constructor ID
  number: number;
  nationality: string;
}

export const DRIVERS: DriverMeta[] = [
  // Red Bull Racing
  { driverId: "max_verstappen", code: "VER", firstName: "Max", lastName: "Verstappen", team: "Red Bull Racing", teamId: "red_bull", number: 1, nationality: "Dutch" },
  { driverId: "lawson", code: "LAW", firstName: "Liam", lastName: "Lawson", team: "Red Bull Racing", teamId: "red_bull", number: 30, nationality: "New Zealander" },
  // McLaren
  { driverId: "norris", code: "NOR", firstName: "Lando", lastName: "Norris", team: "McLaren", teamId: "mclaren", number: 4, nationality: "British" },
  { driverId: "piastri", code: "PIA", firstName: "Oscar", lastName: "Piastri", team: "McLaren", teamId: "mclaren", number: 81, nationality: "Australian" },
  // Ferrari
  { driverId: "hamilton", code: "HAM", firstName: "Lewis", lastName: "Hamilton", team: "Ferrari", teamId: "ferrari", number: 44, nationality: "British" },
  { driverId: "leclerc", code: "LEC", firstName: "Charles", lastName: "Leclerc", team: "Ferrari", teamId: "ferrari", number: 16, nationality: "Monegasque" },
  // Mercedes
  { driverId: "russell", code: "RUS", firstName: "George", lastName: "Russell", team: "Mercedes", teamId: "mercedes", number: 63, nationality: "British" },
  { driverId: "antonelli", code: "ANT", firstName: "Kimi", lastName: "Antonelli", team: "Mercedes", teamId: "mercedes", number: 12, nationality: "Italian" },
  // Aston Martin
  { driverId: "alonso", code: "ALO", firstName: "Fernando", lastName: "Alonso", team: "Aston Martin", teamId: "aston_martin", number: 14, nationality: "Spanish" },
  { driverId: "stroll", code: "STR", firstName: "Lance", lastName: "Stroll", team: "Aston Martin", teamId: "aston_martin", number: 18, nationality: "Canadian" },
  // Alpine
  { driverId: "gasly", code: "GAS", firstName: "Pierre", lastName: "Gasly", team: "Alpine", teamId: "alpine", number: 10, nationality: "French" },
  { driverId: "doohan", code: "DOO", firstName: "Jack", lastName: "Doohan", team: "Alpine", teamId: "alpine", number: 7, nationality: "Australian" },
  // Haas
  { driverId: "bearman", code: "BEA", firstName: "Oliver", lastName: "Bearman", team: "Haas", teamId: "haas", number: 87, nationality: "British" },
  { driverId: "ocon", code: "OCO", firstName: "Esteban", lastName: "Ocon", team: "Haas", teamId: "haas", number: 31, nationality: "French" },
  // RB
  { driverId: "tsunoda", code: "TSU", firstName: "Yuki", lastName: "Tsunoda", team: "RB", teamId: "rb", number: 22, nationality: "Japanese" },
  { driverId: "hadjar", code: "HAD", firstName: "Isack", lastName: "Hadjar", team: "RB", teamId: "rb", number: 6, nationality: "French" },
  // Williams
  { driverId: "albon", code: "ALB", firstName: "Alexander", lastName: "Albon", team: "Williams", teamId: "williams", number: 23, nationality: "Thai" },
  { driverId: "sainz", code: "SAI", firstName: "Carlos", lastName: "Sainz", team: "Williams", teamId: "williams", number: 55, nationality: "Spanish" },
  // Kick Sauber
  { driverId: "hulkenberg", code: "HUL", firstName: "Nico", lastName: "Hulkenberg", team: "Kick Sauber", teamId: "sauber", number: 27, nationality: "German" },
  { driverId: "bortoleto", code: "BOR", firstName: "Gabriel", lastName: "Bortoleto", team: "Kick Sauber", teamId: "sauber", number: 5, nationality: "Brazilian" },
  // Cadillac
  { driverId: "perez", code: "PER", firstName: "Sergio", lastName: "Pérez", team: "Cadillac", teamId: "cadillac", number: 11, nationality: "Mexican" },
  { driverId: "bottas", code: "BOT", firstName: "Valtteri", lastName: "Bottas", team: "Cadillac", teamId: "cadillac", number: 77, nationality: "Finnish" },
];

// Team display order (by expected competitiveness)
export const TEAMS = [
  "Red Bull Racing",
  "McLaren",
  "Ferrari",
  "Mercedes",
  "Aston Martin",
  "Alpine",
  "Haas",
  "RB",
  "Williams",
  "Kick Sauber",
  "Cadillac",
] as const;

export function getDriverMeta(driverId: string): DriverMeta | undefined {
  return DRIVERS.find((d) => d.driverId === driverId);
}

export function getDriverByCode(code: string): DriverMeta | undefined {
  return DRIVERS.find((d) => d.code === code);
}

export function getTeamDrivers(teamId: string): DriverMeta[] {
  return DRIVERS.filter((d) => d.teamId === teamId);
}
