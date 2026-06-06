import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BLEConnectionState,
  DeviceInfo,
  HealthMetricSnapshot,
  PrimarySleepDetail,
  RecoveryDetail,
  ActivitySession,
  StressAlgorithmSummary,
  CardioLoadSummary,
  EnergyBankSummary,
  HRVAnalysis,
  UserProfile,
  CoachMessage,
  GooseMessage,
  AlgorithmDefinition,
} from "../types";

interface AppState {
  bleState: BLEConnectionState;
  device: DeviceInfo;
  liveHR: number | null;
  liveHRUpdatedAt: Date | null;
  liveHRSource: string;
  recentRRIntervals: number[];
  hrv: HRVAnalysis;
  sleepDetail: PrimarySleepDetail | null;
  recovery: RecoveryDetail | null;
  activeActivity: ActivitySession | null;
  todayActivities: ActivitySession[];
  stress: StressAlgorithmSummary;
  cardioLoad: CardioLoadSummary;
  energyBank: EnergyBankSummary;
  healthSnapshots: HealthMetricSnapshot[];
  coachMessages: CoachMessage[];
  logs: GooseMessage[];
  userProfile: UserProfile;
  selectedDate: Date;
  isHistoricalSyncing: boolean;
  historicalSyncStatus: string;
  packetCount: number;
  algorithms: AlgorithmDefinition[];
  capturedPackets: { serviceUUID: string; charUUID: string; data: string; timestamp: Date }[];
  openAIKey: string;
  isCoachLoading: boolean;
  activeTab: string;

  setBLEState: (state: BLEConnectionState) => void;
  updateDevice: (updates: Partial<DeviceInfo>) => void;
  setLiveHR: (bpm: number, source: string) => void;
  addRRIntervals: (intervals: number[]) => void;
  setHRV: (hrv: HRVAnalysis) => void;
  setSleepDetail: (detail: PrimarySleepDetail | null) => void;
  setRecovery: (recovery: RecoveryDetail | null) => void;
  setActiveActivity: (activity: ActivitySession | null) => void;
  setTodayActivities: (activities: ActivitySession[]) => void;
  setStress: (stress: StressAlgorithmSummary) => void;
  setCardioLoad: (load: CardioLoadSummary) => void;
  setEnergyBank: (energy: EnergyBankSummary) => void;
  setHealthSnapshots: (snapshots: HealthMetricSnapshot[]) => void;
  addCoachMessage: (msg: CoachMessage) => void;
  setCoachMessages: (msgs: CoachMessage[]) => void;
  clearCoachMessages: () => void;
  addLog: (msg: GooseMessage) => void;
  setUserProfile: (profile: UserProfile) => void;
  setSelectedDate: (date: Date) => void;
  setHistoricalSyncing: (syncing: boolean, status?: string) => void;
  incrementPacketCount: (count?: number) => void;
  addCapturedPacket: (p: { serviceUUID: string; charUUID: string; data: string; timestamp: Date }) => void;
  setOpenAIKey: (key: string) => void;
  setCoachLoading: (loading: boolean) => void;
  setActiveTab: (tab: string) => void;
}

const defaultDevice: DeviceInfo = {
  name: "WHOOP",
  id: "",
  firmwareVersion: null,
  modelNumber: null,
  hardwareRevision: null,
  manufacturerName: null,
  batteryPercent: null,
  batteryCharging: null,
  connectedAt: null,
  lastSyncAt: null,
};

const defaultHRV: HRVAnalysis = {
  rmssd: null,
  sdnn: null,
  pnn50: null,
  sampleCount: 0,
  baseline: null,
  status: "No data",
};

const defaultStress: StressAlgorithmSummary = {
  score: null,
  status: "No data",
  averageHeartRate: null,
  windows: [],
  highPercent: 0,
  mediumPercent: 0,
  lowPercent: 0,
  hasData: false,
};

const defaultCardio: CardioLoadSummary = {
  points: [],
  status: "No activity data",
  hasData: false,
};

const defaultEnergy: EnergyBankSummary = {
  percent: null,
  status: "No data",
  points: [],
  totalCharged: 0,
  totalDrained: 0,
  primarySleepCharge: 0,
  hasData: false,
};

const defaultProfile: UserProfile = {
  name: "",
  age: null,
  height: null,
  weight: null,
  gender: null,
  maxHeartRate: null,
  restingHeartRate: null,
};

const defaultAlgorithms: AlgorithmDefinition[] = [
  { id: "goose.hrv.v0", displayName: "HRV Analysis v0", family: "vitals", status: "ready", description: "Time-domain HRV: RMSSD, SDNN, PNN50 from RR intervals" },
  { id: "goose.sleep.v1", displayName: "Sleep Score v1", family: "sleep", status: "ready", description: "Multi-stage sleep analysis with baseline tracking and debt calculation" },
  { id: "goose.recovery.v0", displayName: "Recovery Score v0", family: "recovery", status: "ready", description: "Integrated score using HRV, RHR, Sleep, and Strain" },
  { id: "goose.strain.v0", displayName: "Strain Score v0", family: "strain", status: "ready", description: "TRIMP-based cardiovascular load using HR zones" },
  { id: "goose.stress.v0", displayName: "Stress Score v0", family: "stress", status: "ready", description: "Real-time stress estimation via motion-adjusted HR" },
  { id: "goose.cardio_load.v1", displayName: "Cardio Load v1", family: "training", status: "ready", description: "Weekly cardio load from accumulated activity sessions" },
  { id: "goose.energy_bank.v0", displayName: "Energy Bank v0", family: "energy", status: "ready", description: "Energy balance from sleep charge and strain/stress drain" },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      bleState: "disconnected",
      device: defaultDevice,
      liveHR: null,
      liveHRUpdatedAt: null,
      liveHRSource: "waiting",
      recentRRIntervals: [],
      hrv: defaultHRV,
      sleepDetail: null,
      recovery: null,
      activeActivity: null,
      todayActivities: [],
      stress: defaultStress,
      cardioLoad: defaultCardio,
      energyBank: defaultEnergy,
      healthSnapshots: [],
      coachMessages: [],
      logs: [],
      userProfile: defaultProfile,
      selectedDate: new Date(),
      isHistoricalSyncing: false,
      historicalSyncStatus: "idle",
      packetCount: 0,
      algorithms: defaultAlgorithms,
      capturedPackets: [],
      openAIKey: "",
      isCoachLoading: false,
      activeTab: "home",

      setBLEState: (state) => set({ bleState: state }),
      updateDevice: (updates) => set((s) => ({ device: { ...s.device, ...updates } })),
      setLiveHR: (bpm, source) => set({ liveHR: bpm, liveHRUpdatedAt: new Date(), liveHRSource: source }),
      addRRIntervals: (intervals) =>
        set((s) => ({
          recentRRIntervals: [...s.recentRRIntervals, ...intervals].slice(-500),
        })),
      setHRV: (hrv) => set({ hrv }),
      setSleepDetail: (detail) => set({ sleepDetail: detail }),
      setRecovery: (recovery) => set({ recovery }),
      setActiveActivity: (activity) => set({ activeActivity: activity }),
      setTodayActivities: (activities) => set({ todayActivities: activities }),
      setStress: (stress) => set({ stress }),
      setCardioLoad: (load) => set({ cardioLoad: load }),
      setEnergyBank: (energy) => set({ energyBank: energy }),
      setHealthSnapshots: (snapshots) => set({ healthSnapshots: snapshots }),
      addCoachMessage: (msg) => set((s) => ({ coachMessages: [...s.coachMessages, msg] })),
      setCoachMessages: (msgs) => set({ coachMessages: msgs }),
      clearCoachMessages: () => set({ coachMessages: [] }),
      addLog: (msg) =>
        set((s) => ({ logs: [msg, ...s.logs].slice(0, 300) })),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setHistoricalSyncing: (syncing, status) =>
        set((s) => ({ isHistoricalSyncing: syncing, historicalSyncStatus: status ?? s.historicalSyncStatus })),
      incrementPacketCount: (count = 1) => set((s) => ({ packetCount: s.packetCount + count })),
      addCapturedPacket: (p) =>
        set((s) => ({ capturedPackets: [p, ...s.capturedPackets].slice(0, 200) })),
      setOpenAIKey: (key) => set({ openAIKey: key }),
      setCoachLoading: (loading) => set({ isCoachLoading: loading }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "goose-android-store",
      partialize: (state) => ({
        userProfile: state.userProfile,
        openAIKey: state.openAIKey,
        coachMessages: state.coachMessages,
      }),
    }
  )
);
