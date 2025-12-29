import { StationType, type RaceItem } from "../types/race";
import { WORKOUT_STATIONS } from "../constants/raceData";

// Get weight for a station (0-7) in a category
export const getWeight = (
  weights: Record<string, string[]>,
  category: string,
  stationIndex: number
): string => {
  return weights[category]?.[stationIndex] ?? "";
};

// Check if weight should be displayed (not Standard or BW)
export const shouldShowWeight = (weight: string): boolean => {
  return weight !== "Standard" && weight !== "BW" && weight !== "";
};

// Generate full race structure with runs for the view
export const generateRaceSequence = (): RaceItem[] => {
  const sequence: RaceItem[] = [];

  WORKOUT_STATIONS.forEach((station, index) => {
    // Add run before each workout
    sequence.push({
      id: `run-${index + 1}`,
      type: StationType.RUN,
      title: "1 km RUN",
      icon: "Footprints",
      baseMetric: "1 km",
    });

    // Add workout
    sequence.push({
      id: `w-${index + 1}`,
      type: StationType.WORKOUT,
      stationNumber: index + 1,
      title: station.title,
      titleZh: station.titleZh,
      icon: station.icon,
      baseMetric: station.metric,
    });
  });

  return sequence;
};
