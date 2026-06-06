import type { EnergyBankSummary, EnergyStressPoint } from "../types";

export interface EnergyInput {
  sleepDurationMinutes: number;
  sleepScore: number;
  strainScore: number;
  stressWindows: { timeLabel: string; stress: number; isSleepWindow: boolean }[];
  date?: Date;
}

export function computeEnergyBank(input: EnergyInput): EnergyBankSummary {
  const { sleepDurationMinutes, sleepScore, strainScore, stressWindows } = input;

  const maxCapacity = 100;
  const sleepCharge = (sleepDurationMinutes / 480) * (sleepScore / 100) * 90;
  const baselineCharge = 10;
  const totalCharged = Math.min(sleepCharge + baselineCharge, maxCapacity);

  let strainDrain = (strainScore / 21) * 30;
  let stressDrain = 0;

  for (const window of stressWindows) {
    if (!window.isSleepWindow) {
      stressDrain += (window.stress / 100) * 0.5;
    }
  }

  stressDrain = Math.min(stressDrain, 25);
  const totalDrained = strainDrain + stressDrain;
  const remaining = Math.max(0, Math.min(100, totalCharged - totalDrained));

  const points: EnergyStressPoint[] = stressWindows.map((w, i) => {
    const progress = (i + 1) / stressWindows.length;
    const energyAtPoint = Math.max(0, totalCharged - totalDrained * progress);
    return {
      id: `energy-${i}`,
      timeLabel: w.timeLabel,
      energy: Math.round(energyAtPoint),
      stress: Math.round(w.stress),
      isSleepWindow: w.isSleepWindow,
    };
  });

  if (points.length === 0) {
    return {
      percent: null,
      status: "No data",
      points: [],
      totalCharged: 0,
      totalDrained: 0,
      primarySleepCharge: sleepCharge,
      hasData: false,
    };
  }

  let status: string;
  if (remaining >= 70) status = "High Energy";
  else if (remaining >= 40) status = "Moderate";
  else status = "Low Energy";

  return {
    percent: Math.round(remaining),
    status,
    points,
    totalCharged: Math.round(totalCharged),
    totalDrained: Math.round(totalDrained),
    primarySleepCharge: Math.round(sleepCharge),
    hasData: true,
  };
}
