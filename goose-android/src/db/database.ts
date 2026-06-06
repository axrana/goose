import Dexie, { type Table } from "dexie";
import type { HRSample, RRInterval, ActivitySession, CoachMessage, UserProfile } from "../types";

export interface StoredHRSample {
  id?: number;
  bpm: number;
  capturedAt: number;
  rrIntervalsJSON: string;
  source: string;
}

export interface StoredActivity {
  id?: number;
  activityType: string;
  startedAt: number;
  endedAt: number | null;
  strainScore: number;
  caloriesBurned: number;
  avgHeartRate: number;
  maxHeartRate: number;
  durationMinutes: number;
  isActive: number;
  hrSamplesJSON: string;
}

export interface StoredCoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface StoredProfile {
  id: string;
  data: string;
}

export interface StoredDailySummary {
  id: string;
  date: string;
  sleepScore: number | null;
  sleepDurationMinutes: number | null;
  recoveryScore: number | null;
  strainScore: number | null;
  stressScore: number | null;
  energyPercent: number | null;
  hrv: number | null;
  rhr: number | null;
  updatedAt: number;
}

class GooseDatabase extends Dexie {
  hrSamples!: Table<StoredHRSample>;
  activities!: Table<StoredActivity>;
  coachMessages!: Table<StoredCoachMessage>;
  profiles!: Table<StoredProfile>;
  dailySummaries!: Table<StoredDailySummary>;

  constructor() {
    super("GooseAndroidDB");

    this.version(1).stores({
      hrSamples: "++id, capturedAt, source",
      activities: "++id, startedAt, activityType, isActive",
      coachMessages: "id, timestamp",
      profiles: "id",
      dailySummaries: "id, date",
    });
  }
}

export const db = new GooseDatabase();

export async function saveHRSample(sample: HRSample): Promise<void> {
  await db.hrSamples.add({
    bpm: sample.bpm,
    capturedAt: sample.capturedAt.getTime(),
    rrIntervalsJSON: JSON.stringify(sample.rrIntervalsMS ?? []),
    source: sample.source,
  });
}

export async function getHRSamplesForDay(date: Date): Promise<HRSample[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const stored = await db.hrSamples
    .where("capturedAt")
    .between(start.getTime(), end.getTime())
    .toArray();

  return stored.map((s) => ({
    bpm: s.bpm,
    capturedAt: new Date(s.capturedAt),
    rrIntervalsMS: JSON.parse(s.rrIntervalsJSON),
    source: s.source,
  }));
}

export async function getRecentHRSamples(count: number): Promise<HRSample[]> {
  const stored = await db.hrSamples
    .orderBy("capturedAt")
    .reverse()
    .limit(count)
    .toArray();

  return stored.reverse().map((s) => ({
    bpm: s.bpm,
    capturedAt: new Date(s.capturedAt),
    rrIntervalsMS: JSON.parse(s.rrIntervalsJSON),
    source: s.source,
  }));
}

export async function saveActivity(activity: ActivitySession): Promise<number> {
  return await db.activities.add({
    activityType: activity.activityType,
    startedAt: activity.startedAt.getTime(),
    endedAt: activity.endedAt?.getTime() ?? null,
    strainScore: activity.strainScore,
    caloriesBurned: activity.caloriesBurned,
    avgHeartRate: activity.avgHeartRate,
    maxHeartRate: activity.maxHeartRate,
    durationMinutes: activity.durationMinutes,
    isActive: activity.isActive ? 1 : 0,
    hrSamplesJSON: "[]",
  });
}

export async function getActivitiesForDay(date: Date): Promise<ActivitySession[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const stored = await db.activities
    .where("startedAt")
    .between(start.getTime(), end.getTime())
    .toArray();

  return stored.map((s) => ({
    id: s.id,
    activityType: s.activityType,
    startedAt: new Date(s.startedAt),
    endedAt: s.endedAt ? new Date(s.endedAt) : null,
    strainScore: s.strainScore,
    caloriesBurned: s.caloriesBurned,
    avgHeartRate: s.avgHeartRate,
    maxHeartRate: s.maxHeartRate,
    durationMinutes: s.durationMinutes,
    isActive: s.isActive === 1,
  }));
}

export async function getActiveActivity(): Promise<ActivitySession | null> {
  const stored = await db.activities.where("isActive").equals(1).first();
  if (!stored) return null;
  return {
    id: stored.id,
    activityType: stored.activityType,
    startedAt: new Date(stored.startedAt),
    endedAt: stored.endedAt ? new Date(stored.endedAt) : null,
    strainScore: stored.strainScore,
    caloriesBurned: stored.caloriesBurned,
    avgHeartRate: stored.avgHeartRate,
    maxHeartRate: stored.maxHeartRate,
    durationMinutes: stored.durationMinutes,
    isActive: true,
  };
}

export async function updateActivity(id: number, updates: Partial<StoredActivity>): Promise<void> {
  await db.activities.update(id, updates);
}

export async function getProfile(): Promise<UserProfile | null> {
  const stored = await db.profiles.get("default");
  if (!stored) return null;
  try {
    return JSON.parse(stored.data);
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await db.profiles.put({ id: "default", data: JSON.stringify(profile) });
}

export async function getDailySummary(dateKey: string): Promise<StoredDailySummary | null> {
  return (await db.dailySummaries.get(dateKey)) ?? null;
}

export async function saveDailySummary(summary: StoredDailySummary): Promise<void> {
  await db.dailySummaries.put(summary);
}

export async function getCoachMessages(): Promise<CoachMessage[]> {
  const stored = await db.coachMessages.orderBy("timestamp").toArray();
  return stored.map((s) => ({
    id: s.id,
    role: s.role,
    content: s.content,
    timestamp: new Date(s.timestamp),
  }));
}

export async function saveCoachMessage(msg: CoachMessage): Promise<void> {
  await db.coachMessages.put({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.getTime(),
  });
}

export async function clearCoachMessages(): Promise<void> {
  await db.coachMessages.clear();
}
