import type { CardioLoadDay, CardioLoadSummary } from "../types";
import { computeStrainScore } from "./strain";

export interface ActivityForCardio {
  date: Date;
  hrSamples: { bpm: number; durationSeconds: number }[];
  maxHeartRate: number;
  restingHeartRate: number;
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getLoadStatus(load: number, baseline: number): string {
  const ratio = baseline > 0 ? load / baseline : 0;
  if (load === 0) return "Rest";
  if (ratio < 0.5) return "Detraining";
  if (ratio < 0.8) return "Maintaining";
  if (ratio < 1.2) return "Productive";
  if (ratio < 1.5) return "Peaking";
  return "Overtraining";
}

export function computeCardioLoad(activities: ActivityForCardio[], days: number = 7): CardioLoadSummary {
  if (activities.length === 0) {
    return { points: [], status: "No activity data", hasData: false };
  }

  const now = new Date();
  const dailyMap = new Map<string, { load: number; durationMinutes: number }>();

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    dailyMap.set(getDateKey(d), { load: 0, durationMinutes: 0 });
  }

  for (const act of activities) {
    const key = getDateKey(act.date);
    if (!dailyMap.has(key)) continue;
    const result = computeStrainScore(act);
    const prev = dailyMap.get(key)!;
    const duration = act.hrSamples.reduce((s, h) => s + h.durationSeconds, 0) / 60;
    dailyMap.set(key, {
      load: prev.load + result.score,
      durationMinutes: prev.durationMinutes + duration,
    });
  }

  const entries = [...dailyMap.entries()].sort();
  const loads = entries.map(([, v]) => v.load);
  const avgLoad = loads.filter((l) => l > 0).reduce((a, b) => a + b, 0) / Math.max(1, loads.filter((l) => l > 0).length);
  const maxLoad = Math.max(...loads, 1);

  const points: CardioLoadDay[] = entries.map(([key, v], i) => {
    const date = new Date(key);
    const dayLabel = i === entries.length - 1
      ? "Today"
      : date.toLocaleDateString([], { weekday: "short" });
    return {
      id: key,
      dateLabel: dayLabel,
      load: v.load,
      status: getLoadStatus(v.load, avgLoad),
      durationText: formatDuration(v.durationMinutes),
      percent: Math.round((v.load / maxLoad) * 100),
    };
  });

  const latestLoad = points[points.length - 1]?.load ?? 0;
  const overallStatus = getLoadStatus(latestLoad, avgLoad);

  return {
    points,
    status: overallStatus,
    hasData: true,
  };
}
