import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";
import { Play, Square, Heart, Zap, Clock, Flame } from "lucide-react";
import { clsx } from "clsx";
import { ACTIVITY_TYPES } from "../types";
import { computeStrainScore, estimateMaxHeartRate } from "../algorithms/strain";
import { saveActivity, updateActivity } from "../db/database";

export default function ActivityScreen() {
  const navigate = useNavigate();
  const store = useAppStore();
  const [selectedType, setSelectedType] = useState("run");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hrSamplesRef = useRef<{ bpm: number; durationSeconds: number }[]>([]);
  const activeId = useRef<number | null>(null);

  const isActive = !!store.activeActivity;

  useEffect(() => {
    if (isActive && store.activeActivity) {
      const start = store.activeActivity.startedAt.getTime();
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
        if (store.liveHR) {
          hrSamplesRef.current.push({ bpm: store.liveHR, durationSeconds: 5 });
        }
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  const startActivity = async () => {
    const now = new Date();
    const id = await saveActivity({
      activityType: selectedType,
      startedAt: now,
      endedAt: null,
      strainScore: 0,
      caloriesBurned: 0,
      avgHeartRate: 0,
      maxHeartRate: 0,
      durationMinutes: 0,
      isActive: true,
    });
    activeId.current = id as number;
    hrSamplesRef.current = [];
    store.setActiveActivity({
      id: id as number,
      activityType: selectedType,
      startedAt: now,
      endedAt: null,
      strainScore: 0,
      caloriesBurned: 0,
      avgHeartRate: 0,
      maxHeartRate: 0,
      durationMinutes: 0,
      isActive: true,
    });
  };

  const stopActivity = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const profile = store.userProfile;
    const maxHR = profile.maxHeartRate ?? (profile.age ? estimateMaxHeartRate(profile.age) : 190);
    const restHR = profile.restingHeartRate ?? 60;
    const result = computeStrainScore({ hrSamples: hrSamplesRef.current, maxHeartRate: maxHR, restingHeartRate: restHR });
    const durationMinutes = elapsed / 60;
    const now = new Date();
    const act = {
      activityType: selectedType,
      startedAt: store.activeActivity?.startedAt ?? now,
      endedAt: now,
      strainScore: result.score,
      caloriesBurned: result.caloriesBurned,
      avgHeartRate: result.avgHeartRate,
      maxHeartRate: result.maxHeartRate,
      durationMinutes,
      isActive: false,
    };
    if (activeId.current !== null) {
      await updateActivity(activeId.current, {
        endedAt: now.getTime(),
        strainScore: result.score,
        caloriesBurned: result.caloriesBurned,
        avgHeartRate: result.avgHeartRate,
        maxHeartRate: result.maxHeartRate,
        durationMinutes,
        isActive: 0,
      });
    }
    store.setActiveActivity(null);
    store.setTodayActivities([...store.todayActivities, { ...act, id: activeId.current ?? undefined }]);
    setElapsed(0);
    navigate("/home");
  };

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const act = ACTIVITY_TYPES.find((a) => a.type === selectedType)!;

  return (
    <div className="min-h-dvh bg-goose-bg flex flex-col">
      <PageHeader title={isActive ? "Live Activity" : "Start Activity"} showBack={!isActive} />

      <div className="flex-1 px-4 py-4 flex flex-col gap-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}>
        {!isActive && (
          <div>
            <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-3">Activity Type</p>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map((a) => (
                <button
                  key={a.type}
                  onClick={() => setSelectedType(a.type)}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all press-scale",
                    selectedType === a.type
                      ? "border-transparent text-black font-semibold"
                      : "border-goose-border bg-goose-card text-goose-muted"
                  )}
                  style={selectedType === a.type ? { backgroundColor: a.color } : {}}
                >
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-xs font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isActive && (
          <>
            <div className="card p-6 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl" style={{ backgroundColor: `${act.color}20` }}>
                {act.icon}
              </div>
              <p className="text-goose-muted text-sm font-medium mb-2 capitalize">{store.activeActivity?.activityType}</p>
              <p className="text-5xl font-bold text-goose-text tabular-nums font-mono">{fmt(elapsed)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Heart size={14} className="text-goose-hr" />
                  <span className="text-xs text-goose-muted font-medium">Heart Rate</span>
                  {store.liveHR && <div className="w-1.5 h-1.5 rounded-full bg-goose-recovery animate-pulse" />}
                </div>
                <p className="text-3xl font-bold text-goose-text tabular-nums">{store.liveHR ?? "--"}</p>
                <p className="text-xs text-goose-muted">bpm</p>
              </div>
              <div className="card p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Zap size={14} className="text-goose-strain" />
                  <span className="text-xs text-goose-muted font-medium">Strain</span>
                </div>
                <p className="text-3xl font-bold text-goose-text tabular-nums">
                  {hrSamplesRef.current.length > 0
                    ? (() => {
                        const profile = store.userProfile;
                        const r = computeStrainScore({
                          hrSamples: hrSamplesRef.current,
                          maxHeartRate: profile.maxHeartRate ?? 190,
                          restingHeartRate: profile.restingHeartRate ?? 60,
                        });
                        return r.score.toFixed(1);
                      })()
                    : "--"}
                </p>
                <p className="text-xs text-goose-muted">/21</p>
              </div>
              <div className="card p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock size={14} className="text-goose-cardio" />
                  <span className="text-xs text-goose-muted font-medium">Duration</span>
                </div>
                <p className="text-3xl font-bold text-goose-text tabular-nums">{Math.floor(elapsed / 60)}</p>
                <p className="text-xs text-goose-muted">min</p>
              </div>
              <div className="card p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Flame size={14} className="text-goose-energy" />
                  <span className="text-xs text-goose-muted font-medium">Calories</span>
                </div>
                <p className="text-3xl font-bold text-goose-text tabular-nums">
                  {hrSamplesRef.current.length > 0
                    ? computeStrainScore({
                        hrSamples: hrSamplesRef.current,
                        maxHeartRate: store.userProfile.maxHeartRate ?? 190,
                        restingHeartRate: store.userProfile.restingHeartRate ?? 60,
                      }).caloriesBurned
                    : "--"}
                </p>
                <p className="text-xs text-goose-muted">kcal</p>
              </div>
            </div>
          </>
        )}

        <div className="mt-auto">
          {!isActive ? (
            <button
              onClick={startActivity}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 press-scale shadow-lg text-base"
              style={{ backgroundColor: act.color }}
            >
              <Play size={20} fill="white" />
              Start {act.label}
            </button>
          ) : (
            <button
              onClick={stopActivity}
              className="w-full py-4 rounded-2xl font-bold bg-goose-hr text-white flex items-center justify-center gap-2 press-scale shadow-lg text-base"
            >
              <Square size={20} fill="white" />
              Stop Activity
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
