import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { useBLE } from "../hooks/useBLE";
import ScoreDial from "../components/ScoreDial";
import MetricCard from "../components/MetricCard";
import { Bluetooth, BluetoothOff, Plus, Zap, Heart, Activity, Moon, TrendingUp, Battery } from "lucide-react";
import { clsx } from "clsx";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatMinutes } from "../algorithms/sleep";

function ConnectionBanner() {
  const bleState = useAppStore((s) => s.bleState);
  const device = useAppStore((s) => s.device);
  const { connectDevice } = useBLE();
  const { isSupported } = useBLE();

  if (bleState === "ready" || bleState === "connected") return null;

  const isUnsupported = !isSupported || bleState === "unsupported";

  return (
    <button
      onClick={connectDevice}
      disabled={isUnsupported}
      className={clsx(
        "mx-4 mt-4 flex items-center gap-3 p-3 rounded-xl border transition-colors",
        bleState === "scanning" || bleState === "connecting"
          ? "border-goose-energy/40 bg-goose-energy/5"
          : isUnsupported
          ? "border-goose-border bg-goose-card opacity-50"
          : "border-goose-recovery/40 bg-goose-recovery/5 press-scale"
      )}
    >
      {bleState === "scanning" || bleState === "connecting" ? (
        <div className="w-8 h-8 rounded-full bg-goose-energy/20 flex items-center justify-center animate-pulse">
          <Bluetooth size={16} className="text-goose-energy" />
        </div>
      ) : (
        <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center", isUnsupported ? "bg-goose-border" : "bg-goose-recovery/20")}>
          {isUnsupported ? <BluetoothOff size={16} className="text-goose-muted" /> : <Bluetooth size={16} className="text-goose-recovery" />}
        </div>
      )}
      <div className="flex-1 text-left">
        <p className={clsx("text-sm font-semibold", isUnsupported ? "text-goose-muted" : "text-goose-text")}>
          {bleState === "scanning" ? "Scanning…" : bleState === "connecting" ? "Connecting…" : isUnsupported ? "Bluetooth not supported" : "Connect WHOOP"}
        </p>
        <p className="text-xs text-goose-muted">
          {isUnsupported ? "Use Chrome on Android" : "Tap to pair your WHOOP strap"}
        </p>
      </div>
    </button>
  );
}

function SleepStageBar({ stages }: { stages: { stage: string; durationMinutes: number }[] }) {
  const colors: Record<string, string> = { deep: "#4A90D9", rem: "#9B59B6", core: "#4CD964", awake: "#F39C12" };
  const total = stages.reduce((s, st) => s + st.durationMinutes, 0) || 1;
  return (
    <div className="flex rounded-full overflow-hidden h-2 gap-px">
      {stages.map((s, i) => (
        <div
          key={i}
          style={{ width: `${(s.durationMinutes / total) * 100}%`, backgroundColor: colors[s.stage] ?? "#4CD964" }}
        />
      ))}
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const store = useAppStore();
  const { connectDevice } = useBLE();

  const sleepScore = store.sleepDetail ? parseInt(store.sleepDetail.scoreText) || 0 : 0;
  const recoveryScore = store.recovery?.score ?? 0;
  const strainScore = store.todayActivities.reduce((s, a) => s + a.strainScore, 0);
  const strainDisplayScore = Math.min(21, Math.round(strainScore * 10) / 10);
  const strainPercent = Math.round((strainDisplayScore / 21) * 100);

  const today = new Date();
  const dateLabel = today.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  const recoveryColor =
    recoveryScore >= 67 ? "#4CD964" : recoveryScore >= 34 ? "#F0C43F" : recoveryScore > 0 ? "#E74C3C" : "#4a5568";
  const sleepColor = sleepScore >= 85 ? "#4A90D9" : sleepScore >= 70 ? "#4CD964" : sleepScore > 0 ? "#F0C43F" : "#4a5568";

  return (
    <div className="min-h-dvh bg-goose-bg">
      <div
        className="px-4 pt-4 pb-2 flex items-center justify-between"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
      >
        <div>
          <h1 className="text-xl font-bold text-goose-text">Today</h1>
          <p className="text-xs text-goose-muted">{dateLabel}</p>
        </div>
        <BLEStatusButton />
      </div>

      <ConnectionBanner />

      <div className="px-4 pb-6 space-y-4 mt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}>
        {/* Daily Score Card */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-4">Daily Scores</p>
          <div className="flex items-stretch justify-around gap-2">
            <ScoreDial
              title="Sleep"
              value={store.sleepDetail ? store.sleepDetail.scoreText : "--"}
              unit={store.sleepDetail ? "%" : undefined}
              color={sleepColor}
              score={sleepScore}
              subtitle={store.sleepDetail?.qualityText ?? "No data"}
              onClick={() => navigate("/health/sleep")}
            />
            <ScoreDial
              title="Recovery"
              value={recoveryScore > 0 ? `${recoveryScore}` : "--"}
              unit={recoveryScore > 0 ? "%" : undefined}
              color={recoveryColor}
              score={recoveryScore}
              subtitle={store.recovery?.status ?? "No data"}
              onClick={() => navigate("/health/recovery")}
            />
            <ScoreDial
              title="Strain"
              value={strainDisplayScore > 0 ? strainDisplayScore.toFixed(1) : "--"}
              unit={strainDisplayScore > 0 ? "/21" : undefined}
              color="#FF6B35"
              score={strainPercent}
              subtitle={strainDisplayScore < 8 ? "Light" : strainDisplayScore < 14 ? "Moderate" : "High"}
              onClick={() => navigate("/health/strain")}
            />
          </div>
        </div>

        {/* Stress & Energy */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/health/stress")} className="card p-4 text-left press-scale">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-goose-stress" />
              <span className="text-xs font-semibold text-goose-muted uppercase tracking-wider">Stress</span>
            </div>
            <p className="text-2xl font-bold text-goose-text tabular-nums">
              {store.stress.score !== null ? `${store.stress.score}` : "--"}
            </p>
            <p className="text-xs text-goose-stress font-medium mt-1">{store.stress.status}</p>
            {store.stress.windows.length > 0 && (
              <div className="mt-2 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={store.stress.windows.slice(-12)}>
                    <Area type="monotone" dataKey="stress" stroke="#9B59B6" fill="#9B59B620" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </button>

          <button onClick={() => navigate("/health/energyBank")} className="card p-4 text-left press-scale">
            <div className="flex items-center gap-2 mb-2">
              <Battery size={14} className="text-goose-energy" />
              <span className="text-xs font-semibold text-goose-muted uppercase tracking-wider">Energy</span>
            </div>
            <p className="text-2xl font-bold text-goose-text tabular-nums">
              {store.energyBank.percent !== null ? `${store.energyBank.percent}%` : "--"}
            </p>
            <p className="text-xs text-goose-energy font-medium mt-1">{store.energyBank.status}</p>
            {store.energyBank.percent !== null && (
              <div className="mt-2 h-1.5 bg-goose-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-goose-energy transition-all"
                  style={{ width: `${store.energyBank.percent}%` }}
                />
              </div>
            )}
          </button>
        </div>

        {/* Cardio Load Widget */}
        <button onClick={() => navigate("/health/cardioLoad")} className="card p-4 w-full text-left press-scale">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-goose-cardio" />
              <span className="text-xs font-semibold text-goose-muted uppercase tracking-wider">Cardio Load</span>
            </div>
            <span className="text-xs text-goose-cardio font-medium">{store.cardioLoad.status}</span>
          </div>
          {store.cardioLoad.hasData ? (
            <div className="flex items-end gap-1 h-12">
              {store.cardioLoad.points.map((p, i) => (
                <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${Math.max(4, (p.percent / 100) * 44)}px`,
                      backgroundColor: i === store.cardioLoad.points.length - 1 ? "#3498DB" : "#3498DB60",
                    }}
                  />
                  <span className="text-[9px] text-goose-muted">{p.dateLabel.slice(0, 1)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-goose-muted">Log activities to see cardio load</p>
          )}
        </button>

        {/* Health Monitor */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-3">Health Monitor</p>
          <div className="grid grid-cols-2 gap-3">
            <VitalTile
              label="Heart Rate"
              value={store.liveHR ? `${store.liveHR}` : "--"}
              unit="bpm"
              color="#E74C3C"
              icon={<Heart size={12} />}
              live={!!store.liveHR}
              onClick={() => navigate("/health/healthMonitor")}
            />
            <VitalTile
              label="HRV"
              value={store.hrv.rmssd ? `${Math.round(store.hrv.rmssd)}` : "--"}
              unit="ms"
              color="#1ABC9C"
              icon={<Activity size={12} />}
              onClick={() => navigate("/health/healthMonitor")}
            />
            <VitalTile
              label="Resp. Rate"
              value="--"
              unit="rpm"
              color="#4A90D9"
              icon={<span className="text-[10px]">🫁</span>}
              onClick={() => navigate("/health/healthMonitor")}
            />
            <VitalTile
              label="Skin Temp"
              value="--"
              unit="°Δ"
              color="#E67E22"
              icon={<span className="text-[10px]">🌡</span>}
              onClick={() => navigate("/health/healthMonitor")}
            />
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider">Activity Timeline</p>
            {store.sleepDetail && (
              <span className="text-xs text-goose-muted">{store.sleepDetail.durationText} sleep</span>
            )}
          </div>

          {store.sleepDetail && (
            <div className="mb-3 p-3 bg-goose-bg rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Moon size={14} className="text-goose-sleep" />
                <span className="text-sm font-medium text-goose-text">Sleep</span>
                <span className="text-xs text-goose-muted ml-auto">
                  {store.sleepDetail.startLabel} – {store.sleepDetail.endLabel}
                </span>
              </div>
              <SleepStageBar stages={store.sleepDetail.stages} />
            </div>
          )}

          {store.todayActivities.length > 0 ? (
            <div className="space-y-2">
              {store.todayActivities.map((act) => (
                <div key={act.id} className="flex items-center gap-3 p-3 bg-goose-bg rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-goose-strain/20 flex items-center justify-center">
                    <Activity size={16} className="text-goose-strain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-goose-text capitalize">{act.activityType}</p>
                    <p className="text-xs text-goose-muted">
                      {act.strainScore.toFixed(1)} strain · {act.caloriesBurned} cal · {Math.round(act.durationMinutes)}m
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !store.sleepDetail && (
              <p className="text-sm text-goose-muted text-center py-2">
                No activities logged today. Connect your WHOOP or start a manual session.
              </p>
            )
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/activity")}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-goose-strain flex items-center justify-center shadow-lg press-scale z-40"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)" }}
      >
        <Plus size={24} className="text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function BLEStatusButton() {
  const bleState = useAppStore((s) => s.bleState);
  const device = useAppStore((s) => s.device);
  const navigate = useNavigate();
  const isConnected = bleState === "ready" || bleState === "connected";
  return (
    <button
      onClick={() => navigate("/more")}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border press-scale",
        isConnected
          ? "border-goose-recovery/40 text-goose-recovery bg-goose-recovery/10"
          : "border-goose-border text-goose-muted bg-goose-card"
      )}
    >
      {isConnected ? (
        <><Bluetooth size={12} />{device.batteryPercent ? `${device.batteryPercent}%` : "Connected"}</>
      ) : (
        <><BluetoothOff size={12} />Disconnected</>
      )}
    </button>
  );
}

function VitalTile({
  label, value, unit, color, icon, live, onClick
}: {
  label: string; value: string; unit: string; color: string; icon: React.ReactNode; live?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="bg-goose-bg rounded-xl p-3 text-left press-scale">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] text-goose-muted font-medium uppercase tracking-wider flex-1">{label}</span>
        {live && <div className="w-1.5 h-1.5 rounded-full bg-goose-recovery animate-pulse" />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-goose-text tabular-nums">{value}</span>
        <span className="text-xs text-goose-muted">{unit}</span>
      </div>
    </button>
  );
}
