export interface HRVResult {
  rmssd: number | null;
  sdnn: number | null;
  pnn50: number | null;
  sampleCount: number;
  status: string;
}

export function computeHRV(rrIntervalsMS: number[]): HRVResult {
  const filtered = rrIntervalsMS.filter((rr) => rr >= 300 && rr <= 2000);

  if (filtered.length < 3) {
    return { rmssd: null, sdnn: null, pnn50: null, sampleCount: filtered.length, status: "Insufficient data" };
  }

  const mean = filtered.reduce((s, v) => s + v, 0) / filtered.length;

  let sumSqDiff = 0;
  let sumSqSuccDiff = 0;
  let nn50Count = 0;

  for (let i = 0; i < filtered.length; i++) {
    sumSqDiff += (filtered[i] - mean) ** 2;
  }

  for (let i = 1; i < filtered.length; i++) {
    const diff = filtered[i] - filtered[i - 1];
    sumSqSuccDiff += diff ** 2;
    if (Math.abs(diff) > 50) nn50Count++;
  }

  const rmssd = Math.sqrt(sumSqSuccDiff / (filtered.length - 1));
  const sdnn = Math.sqrt(sumSqDiff / filtered.length);
  const pnn50 = (nn50Count / (filtered.length - 1)) * 100;

  return {
    rmssd: Math.round(rmssd * 10) / 10,
    sdnn: Math.round(sdnn * 10) / 10,
    pnn50: Math.round(pnn50 * 10) / 10,
    sampleCount: filtered.length,
    status: "Computed",
  };
}

export function computeHRVScore(rmssd: number, baseline: number | null): number {
  if (baseline === null || baseline <= 0) return 50;
  const ratio = rmssd / baseline;
  if (ratio >= 1.2) return 90;
  if (ratio >= 1.0) return 70 + (ratio - 1.0) / 0.2 * 20;
  if (ratio >= 0.7) return 40 + (ratio - 0.7) / 0.3 * 30;
  return Math.max(10, ratio * 40 / 0.7);
}
