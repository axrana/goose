export interface RecoveryInput {
  hrv: number | null;
  rhr: number | null;
  sleepScore: number | null;
  previousStrainScore: number | null;
  spo2: number | null;
  hrvBaseline: number | null;
  rhrBaseline: number | null;
}

export interface RecoveryResult {
  score: number;
  status: string;
  label: string;
  color: string;
  components: {
    hrv: number;
    rhr: number;
    sleep: number;
    strain: number;
  };
}

export function computeRecoveryScore(input: RecoveryInput): RecoveryResult {
  let hrvComponent = 50;
  let rhrComponent = 50;
  let sleepComponent = 50;
  let strainComponent = 50;

  if (input.hrv !== null && input.hrvBaseline !== null && input.hrvBaseline > 0) {
    const ratio = input.hrv / input.hrvBaseline;
    if (ratio >= 1.2) hrvComponent = 95;
    else if (ratio >= 1.0) hrvComponent = 70 + ((ratio - 1.0) / 0.2) * 25;
    else if (ratio >= 0.7) hrvComponent = 35 + ((ratio - 0.7) / 0.3) * 35;
    else hrvComponent = Math.max(5, ratio * 35 / 0.7);
  } else if (input.hrv !== null) {
    if (input.hrv >= 70) hrvComponent = 85;
    else if (input.hrv >= 50) hrvComponent = 65;
    else if (input.hrv >= 30) hrvComponent = 45;
    else hrvComponent = 25;
  }

  if (input.rhr !== null) {
    const baseline = input.rhrBaseline ?? 60;
    const delta = input.rhr - baseline;
    if (delta <= -3) rhrComponent = 90;
    else if (delta <= 0) rhrComponent = 75;
    else if (delta <= 3) rhrComponent = 55;
    else if (delta <= 6) rhrComponent = 35;
    else rhrComponent = 15;
  }

  if (input.sleepScore !== null) {
    sleepComponent = input.sleepScore;
  }

  if (input.previousStrainScore !== null) {
    const strain = input.previousStrainScore;
    if (strain <= 8) strainComponent = 85;
    else if (strain <= 14) strainComponent = 65;
    else if (strain <= 18) strainComponent = 45;
    else strainComponent = 25;
  }

  const score = Math.round(
    hrvComponent * 0.4 +
    rhrComponent * 0.2 +
    sleepComponent * 0.3 +
    strainComponent * 0.1
  );

  const clamped = Math.min(Math.max(score, 1), 100);

  let status: string;
  let label: string;
  let color: string;
  if (clamped >= 67) {
    status = "Recovered";
    label = "Green";
    color = "#4CD964";
  } else if (clamped >= 34) {
    status = "Moderate";
    label = "Yellow";
    color = "#F0C43F";
  } else {
    status = "Low Recovery";
    label = "Red";
    color = "#E74C3C";
  }

  return {
    score: clamped,
    status,
    label,
    color,
    components: {
      hrv: Math.round(hrvComponent),
      rhr: Math.round(rhrComponent),
      sleep: Math.round(sleepComponent),
      strain: Math.round(strainComponent),
    },
  };
}
