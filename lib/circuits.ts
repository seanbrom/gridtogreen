// Map OpenF1 circuit_short_name → Jolpica circuitId
export const CIRCUIT_MAP: Record<string, string> = {
  Bahrain: "bahrain",
  Jeddah: "jeddah",
  Melbourne: "albert_park",
  Suzuka: "suzuka",
  Shanghai: "shanghai",
  Miami: "miami",
  Imola: "imola",
  Monaco: "monaco",
  Barcelona: "catalunya",
  Montreal: "villeneuve",
  Spielberg: "red_bull_ring",
  Silverstone: "silverstone",
  Budapest: "hungaroring",
  "Spa-Francorchamps": "spa",
  Zandvoort: "zandvoort",
  Monza: "monza",
  Baku: "baku",
  Singapore: "marina_bay",
  Austin: "americas",
  "Mexico City": "rodriguez",
  "São Paulo": "interlagos",
  "Las Vegas": "vegas",
  Lusail: "losail",
  "Yas Island": "yas_marina",
};

// Rich circuit metadata for programmatic circuit pages
export interface CircuitMeta {
  circuitId: string;
  openF1Name: string;
  grandPrixName: string;
  country: string;
  locality: string;
}

export const CIRCUITS: CircuitMeta[] = [
  { circuitId: "bahrain", openF1Name: "Bahrain", grandPrixName: "Bahrain Grand Prix", country: "Bahrain", locality: "Sakhir" },
  { circuitId: "jeddah", openF1Name: "Jeddah", grandPrixName: "Saudi Arabian Grand Prix", country: "Saudi Arabia", locality: "Jeddah" },
  { circuitId: "albert_park", openF1Name: "Melbourne", grandPrixName: "Australian Grand Prix", country: "Australia", locality: "Melbourne" },
  { circuitId: "suzuka", openF1Name: "Suzuka", grandPrixName: "Japanese Grand Prix", country: "Japan", locality: "Suzuka" },
  { circuitId: "shanghai", openF1Name: "Shanghai", grandPrixName: "Chinese Grand Prix", country: "China", locality: "Shanghai" },
  { circuitId: "miami", openF1Name: "Miami", grandPrixName: "Miami Grand Prix", country: "USA", locality: "Miami" },
  { circuitId: "imola", openF1Name: "Imola", grandPrixName: "Emilia Romagna Grand Prix", country: "Italy", locality: "Imola" },
  { circuitId: "monaco", openF1Name: "Monaco", grandPrixName: "Monaco Grand Prix", country: "Monaco", locality: "Monte Carlo" },
  { circuitId: "catalunya", openF1Name: "Barcelona", grandPrixName: "Spanish Grand Prix", country: "Spain", locality: "Barcelona" },
  { circuitId: "villeneuve", openF1Name: "Montreal", grandPrixName: "Canadian Grand Prix", country: "Canada", locality: "Montreal" },
  { circuitId: "red_bull_ring", openF1Name: "Spielberg", grandPrixName: "Austrian Grand Prix", country: "Austria", locality: "Spielberg" },
  { circuitId: "silverstone", openF1Name: "Silverstone", grandPrixName: "British Grand Prix", country: "UK", locality: "Silverstone" },
  { circuitId: "hungaroring", openF1Name: "Budapest", grandPrixName: "Hungarian Grand Prix", country: "Hungary", locality: "Budapest" },
  { circuitId: "spa", openF1Name: "Spa-Francorchamps", grandPrixName: "Belgian Grand Prix", country: "Belgium", locality: "Spa" },
  { circuitId: "zandvoort", openF1Name: "Zandvoort", grandPrixName: "Dutch Grand Prix", country: "Netherlands", locality: "Zandvoort" },
  { circuitId: "monza", openF1Name: "Monza", grandPrixName: "Italian Grand Prix", country: "Italy", locality: "Monza" },
  { circuitId: "baku", openF1Name: "Baku", grandPrixName: "Azerbaijan Grand Prix", country: "Azerbaijan", locality: "Baku" },
  { circuitId: "marina_bay", openF1Name: "Singapore", grandPrixName: "Singapore Grand Prix", country: "Singapore", locality: "Singapore" },
  { circuitId: "americas", openF1Name: "Austin", grandPrixName: "United States Grand Prix", country: "USA", locality: "Austin" },
  { circuitId: "rodriguez", openF1Name: "Mexico City", grandPrixName: "Mexico City Grand Prix", country: "Mexico", locality: "Mexico City" },
  { circuitId: "interlagos", openF1Name: "São Paulo", grandPrixName: "São Paulo Grand Prix", country: "Brazil", locality: "São Paulo" },
  { circuitId: "vegas", openF1Name: "Las Vegas", grandPrixName: "Las Vegas Grand Prix", country: "USA", locality: "Las Vegas" },
  { circuitId: "losail", openF1Name: "Lusail", grandPrixName: "Qatar Grand Prix", country: "Qatar", locality: "Lusail" },
  { circuitId: "yas_marina", openF1Name: "Yas Island", grandPrixName: "Abu Dhabi Grand Prix", country: "UAE", locality: "Abu Dhabi" },
];

export function getCircuitMeta(circuitId: string): CircuitMeta | undefined {
  return CIRCUITS.find((c) => c.circuitId === circuitId);
}

// Reverse lookup: find circuitId from a briefing's circuit/location fields
export function findCircuitIdForBriefing(circuit: string): string | undefined {
  // Try direct match from CIRCUIT_MAP (OpenF1 short name → circuitId)
  if (CIRCUIT_MAP[circuit]) return CIRCUIT_MAP[circuit];
  // Try matching against CIRCUITS metadata
  const match = CIRCUITS.find(
    (c) =>
      c.openF1Name === circuit ||
      c.locality === circuit ||
      c.grandPrixName.includes(circuit)
  );
  return match?.circuitId;
}
