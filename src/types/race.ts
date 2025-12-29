export enum StationType {
  START = "START",
  RUN = "RUN",
  WORKOUT = "WORKOUT",
  FINISH = "FINISH",
}

export enum RaceCategory {
  // Individual
  INDIVIDUAL_WOMEN = "Women",
  INDIVIDUAL_WOMEN_PRO = "Women Pro",
  INDIVIDUAL_MEN = "Men",
  INDIVIDUAL_MEN_PRO = "Men Pro",
  // Doubles
  DOUBLES_WOMEN = "Doubles Women",
  DOUBLES_MEN = "Doubles Men",
  DOUBLES_MIXED = "Doubles Mixed",
  // Relay
  RELAY_WOMEN = "Relay Women",
  RELAY_MEN = "Relay Men",
  RELAY_MIXED = "Relay Mixed",
}

export interface StationStandard {
  weight?: string;
  distance?: string;
  reps?: string;
  details?: string; // For combined strings like "2x25m"
}

export interface RaceItem {
  id: string;
  type: StationType;
  title: string;
  titleZh?: string;
  stationNumber?: number; // 1-8 for workouts
  icon?: string; // Icon name from lucide-vue-next
  // Base default values (fixed across categories mostly)
  baseMetric?: string;
  // Dynamic standards
  defaultStandard?: StationStandard;
}
