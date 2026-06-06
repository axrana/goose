import type { SleepStageSegment } from "../types";

export interface SleepInput {
  startTimeMS: number;
  endTimeMS: number;
  stages?: { stage: SleepStageSegment["stage"]; durationMinutes: number }[];
  rrIntervals?: number[];
}

export interface SleepResult {
  score: number;
  durationMinutes: number;
  timeInBedMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  coreMinutes: number;
  awakeMinutes: number;
  stages: SleepStageSegment[];
  qualityLabel: string;
  status: string;
}

function sleepQualityLabel(score: number): string {
  if (score >= 85) return "Optimal";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

export function computeSleepScore(input: SleepInput): SleepResult {
  const totalMinutes = (input.endTimeMS - input.startTimeMS) / 60000;
  const timeInBed = totalMinutes;

  let deepMinutes = 0;
  let remMinutes = 0;
  let coreMinutes = 0;
  let awakeMinutes = 0;
  let stages: SleepStageSegment[] = [];

  if (input.stages && input.stages.length > 0) {
    for (const [i, s] of input.stages.entries()) {
      switch (s.stage) {
        case "deep": deepMinutes += s.durationMinutes; break;
        case "rem": remMinutes += s.durationMinutes; break;
        case "core": coreMinutes += s.durationMinutes; break;
        case "awake": awakeMinutes += s.durationMinutes; break;
      }
      const start = new Date(input.startTimeMS + i * s.durationMinutes * 60000);
      const end = new Date(start.getTime() + s.durationMinutes * 60000);
      stages.push({
        id: `stage-${i}-${s.stage}`,
        stage: s.stage,
        startLabel: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endLabel: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        durationMinutes: s.durationMinutes,
      });
    }
  } else {
    const sleepDur = totalMinutes * 0.93;
    awakeMinutes = totalMinutes * 0.07;
    deepMinutes = sleepDur * 0.2;
    remMinutes = sleepDur * 0.22;
    coreMinutes = sleepDur * 0.58;

    const stageData: { stage: SleepStageSegment["stage"]; dur: number }[] = [
      { stage: "core", dur: coreMinutes * 0.4 },
      { stage: "deep", dur: deepMinutes },
      { stage: "rem", dur: remMinutes * 0.5 },
      { stage: "core", dur: coreMinutes * 0.4 },
      { stage: "rem", dur: remMinutes * 0.5 },
      { stage: "awake", dur: awakeMinutes },
    ];

    let offset = 0;
    stages = stageData.map((s, i) => {
      const start = new Date(input.startTimeMS + offset * 60000);
      offset += s.dur;
      const end = new Date(input.startTimeMS + offset * 60000);
      return {
        id: `stage-${i}-${s.stage}`,
        stage: s.stage,
        startLabel: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endLabel: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        durationMinutes: Math.round(s.dur * 10) / 10,
      };
    });
  }

  const sleepDuration = deepMinutes + remMinutes + coreMinutes;

  let score = 0;
  const durationScore = Math.min(sleepDuration / 480, 1) * 40;
  const deepScore = Math.min(deepMinutes / 90, 1) * 25;
  const remScore = Math.min(remMinutes / 100, 1) * 25;
  const efficiencyScore = Math.min(sleepDuration / timeInBed, 1) * 10;
  score = durationScore + deepScore + remScore + efficiencyScore;

  return {
    score: Math.min(Math.round(score), 100),
    durationMinutes: Math.round(sleepDuration),
    timeInBedMinutes: Math.round(timeInBed),
    deepMinutes: Math.round(deepMinutes),
    remMinutes: Math.round(remMinutes),
    coreMinutes: Math.round(coreMinutes),
    awakeMinutes: Math.round(awakeMinutes),
    stages,
    qualityLabel: sleepQualityLabel(score),
    status: "Computed",
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
