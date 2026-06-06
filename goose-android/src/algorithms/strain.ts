export interface HRZone {
  zone: 1 | 2 | 3 | 4 | 5;
  label: string;
  minPercent: number;
  maxPercent: number;
  minutesInZone: number;
  color: string;
}

export interface StrainInput {
  hrSamples: { bpm: number; durationSeconds: number }[];
  maxHeartRate: number;
  restingHeartRate: number;
  durationMinutes?: number;
}

export interface StrainResult {
  score: number;
  label: string;
  caloriesBurned: number;
  avgHeartRate: number;
  maxHeartRate: number;
  zones: HRZone[];
  status: string;
}

function hrZoneLabel(zone: number): string {
  return ["", "Light", "Moderate", "Aerobic", "Threshold", "Max"][zone] ?? "Unknown";
}

const ZONE_COLORS = ["", "#4A90D9", "#4CD964", "#F0C43F", "#FF6B35", "#E74C3C"];

export function getHRZone(bpm: number, maxHR: number, restHR: number): 1 | 2 | 3 | 4 | 5 {
  const hrrPercent = (bpm - restHR) / (maxHR - restHR);
  if (hrrPercent < 0.5) return 1;
  if (hrrPercent < 0.6) return 2;
  if (hrrPercent < 0.7) return 3;
  if (hrrPercent < 0.8) return 4;
  return 5;
}

export function computeStrainScore(input: StrainInput): StrainResult {
  if (input.hrSamples.length === 0) {
    return {
      score: 0,
      label: "No data",
      caloriesBurned: 0,
      avgHeartRate: 0,
      maxHeartRate: 0,
      zones: [],
      status: "No HR data",
    };
  }

  const zones: Map<number, HRZone> = new Map();
  for (let z = 1; z <= 5; z++) {
    zones.set(z, {
      zone: z as 1 | 2 | 3 | 4 | 5,
      label: hrZoneLabel(z),
      minPercent: [0, 0, 50, 60, 70, 80][z],
      maxPercent: [0, 50, 60, 70, 80, 100][z],
      minutesInZone: 0,
      color: ZONE_COLORS[z],
    });
  }

  let trimpSum = 0;
  let bpmSum = 0;
  let maxBPM = 0;
  let totalSeconds = 0;

  for (const sample of input.hrSamples) {
    const { bpm, durationSeconds } = sample;
    const minutes = durationSeconds / 60;
    const hrrPercent = Math.max(0, (bpm - input.restingHeartRate) / (input.maxHeartRate - input.restingHeartRate));
    const zone = getHRZone(bpm, input.maxHeartRate, input.restingHeartRate);
    const zoneData = zones.get(zone)!;
    zoneData.minutesInZone += minutes;

    const y = hrrPercent;
    const trimpFactor = y * 0.64 * Math.exp(1.92 * y);
    trimpSum += trimpFactor * minutes;

    bpmSum += bpm * minutes;
    totalSeconds += durationSeconds;
    if (bpm > maxBPM) maxBPM = bpm;
  }

  const totalMinutes = totalSeconds / 60;
  const avgBPM = totalMinutes > 0 ? bpmSum / totalMinutes : 0;
  const caloriesBurned = Math.round(trimpSum * 5);
  const strainScore = Math.min(21, Math.round(trimpSum / 8 * 10) / 10);

  let label: string;
  if (strainScore < 8) label = "Light";
  else if (strainScore < 12) label = "Moderate";
  else if (strainScore < 16) label = "Strenuous";
  else if (strainScore < 19) label = "Very Strenuous";
  else label = "All Out";

  return {
    score: strainScore,
    label,
    caloriesBurned,
    avgHeartRate: Math.round(avgBPM),
    maxHeartRate: maxBPM,
    zones: Array.from(zones.values()),
    status: "Computed",
  };
}

export function estimateMaxHeartRate(age: number): number {
  return Math.round(208 - 0.7 * age);
}
