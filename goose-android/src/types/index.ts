export type MetricRoute =
  | "healthMonitor"
  | "sleep"
  | "recovery"
  | "strain"
  | "stress"
  | "cardioLoad"
  | "energyBank"
  | "packetInputs"
  | "algorithms"
  | "referenceComparisons"
  | "calibration";

export interface HRSample {
  id?: number;
  bpm: number;
  capturedAt: Date;
  rrIntervalsMS?: number[];
  source: string;
}

export interface RRInterval {
  id?: number;
  intervalMS: number;
  capturedAt: Date;
  source: string;
}

export interface HealthMetricSnapshot {
  id: string;
  route: MetricRoute;
  title: string;
  value: string;
  unit: string;
  status: string;
  freshness: string;
  tint: string;
  trend: HealthTrendModel;
}

export interface HealthTrendModel {
  id: string;
  title: string;
  rangeLabel: string;
  summary: string;
  points: HealthTrendPoint[];
}

export interface HealthTrendPoint {
  id: string;
  label: string;
  value: number;
}

export interface SleepStageSegment {
  id: string;
  stage: "awake" | "core" | "rem" | "deep";
  startLabel: string;
  endLabel: string;
  durationMinutes: number;
  confidence?: number;
}

export interface PrimarySleepDetail {
  id: string;
  dateLabel: string;
  startLabel: string;
  endLabel: string;
  durationText: string;
  timeInBedText: string;
  scoreText: string;
  qualityText: string;
  stages: SleepStageSegment[];
}

export interface RecoveryDetail {
  id: string;
  score: number;
  hrv: number | null;
  rhr: number | null;
  spo2: number | null;
  respiratoryRate: number | null;
  skinTempDelta: number | null;
  status: string;
  dateLabel: string;
}

export interface ActivitySession {
  id?: number;
  activityType: string;
  startedAt: Date;
  endedAt: Date | null;
  strainScore: number;
  caloriesBurned: number;
  avgHeartRate: number;
  maxHeartRate: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface StressWindowPoint {
  id: string;
  start: Date;
  end: Date;
  timeLabel: string;
  stress: number;
  averageHeartRate: number;
  sampleCount: number;
  isSleepWindow: boolean;
}

export interface StressAlgorithmSummary {
  score: number | null;
  status: string;
  averageHeartRate: number | null;
  windows: StressWindowPoint[];
  highPercent: number;
  mediumPercent: number;
  lowPercent: number;
  hasData: boolean;
}

export interface CardioLoadDay {
  id: string;
  dateLabel: string;
  load: number;
  status: string;
  durationText: string;
  percent: number;
}

export interface CardioLoadSummary {
  points: CardioLoadDay[];
  status: string;
  hasData: boolean;
}

export interface EnergyStressPoint {
  id: string;
  timeLabel: string;
  energy: number;
  stress: number;
  isSleepWindow: boolean;
}

export interface EnergyBankSummary {
  percent: number | null;
  status: string;
  points: EnergyStressPoint[];
  totalCharged: number;
  totalDrained: number;
  hasData: boolean;
}

export type BLEConnectionState =
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "ready"
  | "error"
  | "unsupported";

export interface DeviceInfo {
  name: string;
  id: string;
  firmwareVersion: string | null;
  modelNumber: string | null;
  hardwareRevision: string | null;
  manufacturerName: string | null;
  batteryPercent: number | null;
  batteryCharging: boolean | null;
  connectedAt: Date | null;
  lastSyncAt: Date | null;
}

export interface GooseMessage {
  id: string;
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error";
  source: string;
  title: string;
  body: string;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  name: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | "other" | null;
  maxHeartRate: number | null;
  restingHeartRate: number | null;
}

export interface HRVAnalysis {
  rmssd: number | null;
  sdnn: number | null;
  pnn50: number | null;
  sampleCount: number;
  baseline: number | null;
  status: string;
}

export interface AlgorithmDefinition {
  id: string;
  displayName: string;
  family: string;
  status: "ready" | "pending" | "unavailable";
  description: string;
}

export type ActivityType =
  | "run"
  | "walk"
  | "cycling"
  | "swimming"
  | "weightlifting"
  | "hiit"
  | "yoga"
  | "sports"
  | "other";

export const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: string; color: string }[] = [
  { type: "run", label: "Run", icon: "🏃", color: "#FF6B35" },
  { type: "walk", label: "Walk", icon: "🚶", color: "#4CD964" },
  { type: "cycling", label: "Cycling", icon: "🚴", color: "#4A90D9" },
  { type: "swimming", label: "Swimming", icon: "🏊", color: "#1ABC9C" },
  { type: "weightlifting", label: "Weights", icon: "🏋️", color: "#E74C3C" },
  { type: "hiit", label: "HIIT", icon: "⚡", color: "#F39C12" },
  { type: "yoga", label: "Yoga", icon: "🧘", color: "#9B59B6" },
  { type: "sports", label: "Sports", icon: "⚽", color: "#3498DB" },
  { type: "other", label: "Other", icon: "🎯", color: "#95A5A6" },
];
