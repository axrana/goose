import type { StressWindowPoint, StressAlgorithmSummary } from "../types";

export interface HRSampleForStress {
  bpm: number;
  capturedAt: Date;
}

function isLikelySleepHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 6;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function computeStress(
  hrSamples: HRSampleForStress[],
  restingHeartRate: number,
  date: Date = new Date()
): StressAlgorithmSummary {
  if (hrSamples.length < 6) {
    return {
      score: null,
      status: "Insufficient data",
      averageHeartRate: null,
      windows: [],
      highPercent: 0,
      mediumPercent: 0,
      lowPercent: 0,
      hasData: false,
    };
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const bucketMS = 10 * 60 * 1000;
  const grouped = new Map<number, HRSampleForStress[]>();

  for (const sample of hrSamples) {
    const bucket = Math.floor((sample.capturedAt.getTime() - dayStart.getTime()) / bucketMS);
    if (!grouped.has(bucket)) grouped.set(bucket, []);
    grouped.get(bucket)!.push(sample);
  }

  const windows: StressWindowPoint[] = [];

  for (const [bucket, samples] of [...grouped.entries()].sort((a, b) => a[0] - b[0])) {
    if (samples.length === 0) continue;

    const bpms = samples.map((s) => s.bpm);
    const avgHR = bpms.reduce((a, b) => a + b, 0) / bpms.length;
    const minHR = Math.min(...bpms);
    const maxHR = Math.max(...bpms);

    const hrPressure = clamp(
      (avgHR - restingHeartRate) / Math.max(32, restingHeartRate * 0.62),
      0, 1
    );
    const volatilityPressure = clamp(
      ((maxHR - minHR) / Math.max(avgHR, 1)) / 0.24,
      0, 1
    );

    const start = new Date(dayStart.getTime() + bucket * bucketMS);
    const end = new Date(start.getTime() + bucketMS);
    const isSleep = isLikelySleepHour(start);

    let stress = (hrPressure * 0.88 + volatilityPressure * 0.12) * 100;
    if (isSleep) stress *= 0.62;
    if (avgHR <= restingHeartRate + 4) stress *= 0.65;
    stress = clamp(stress, 0, 100);

    windows.push({
      id: `${bucket}`,
      start,
      end,
      timeLabel: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      stress,
      averageHeartRate: Math.round(avgHR),
      sampleCount: samples.length,
      isSleepWindow: isSleep,
    });
  }

  if (windows.length === 0) {
    return {
      score: null,
      status: "No windows",
      averageHeartRate: null,
      windows: [],
      highPercent: 0,
      mediumPercent: 0,
      lowPercent: 0,
      hasData: false,
    };
  }

  const avgStress = windows.reduce((s, w) => s + w.stress, 0) / windows.length;
  const allBPMs = hrSamples.map((s) => s.bpm);
  const avgHR = allBPMs.reduce((a, b) => a + b, 0) / allBPMs.length;

  const high = windows.filter((w) => w.stress >= 60).length / windows.length;
  const medium = windows.filter((w) => w.stress >= 30 && w.stress < 60).length / windows.length;
  const low = windows.filter((w) => w.stress < 30).length / windows.length;

  return {
    score: Math.round(avgStress),
    status: avgStress >= 60 ? "High" : avgStress >= 30 ? "Moderate" : "Low",
    averageHeartRate: Math.round(avgHR),
    windows,
    highPercent: Math.round(high * 100),
    mediumPercent: Math.round(medium * 100),
    lowPercent: Math.round(low * 100),
    hasData: true,
  };
}
