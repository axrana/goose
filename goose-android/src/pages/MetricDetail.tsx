import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import { Moon, Heart, Activity, Zap, TrendingUp, Battery, BarChart2, Cpu } from "lucide-react";
import { clsx } from "clsx";
import { formatMinutes } from "../algorithms/sleep";
import type { MetricRoute } from "../types";

const METRIC_META: Record<string, { title: string; color: string; unit: string; icon: React.ReactNode }> = {
  sleep:           { title: "Sleep",        color: "#4A90D9", unit: "%",    icon: <Moon size={18} /> },
  recovery:        { title: "Recovery",     color: "#4CD964", unit: "%",    icon: <Heart size={18} /> },
  strain:          { title: "Strain",       color: "#FF6B35", unit: "/21",  icon: <Activity size={18} /> },
  stress:          { title: "Stress",       color: "#9B59B6", unit: "",     icon: <Zap size={18} /> },
  cardioLoad:      { title: "Cardio Load",  color: "#3498DB", unit: "",     icon: <TrendingUp size={18} /> },
  energyBank:      { title: "Energy Bank",  color: "#F39C12", unit: "%",    icon: <Battery size={18} /> },
  healthMonitor:   { title: "Health Monitor", color: "#E74C3C", unit: "bpm", icon: <Heart size={18} /> },
  packetInputs:    { title: "Packet Inputs", color: "#8a9ba3", unit: "",    icon: <BarChart2 size={18} /> },
  algorithms:      { title: "Algorithms",   color: "#8a9ba3", unit: "",     icon: <Cpu size={18} /> },
  referenceComparisons: { title: "Reference", color: "#8a9ba3", unit: "",   icon: <BarChart2 size={18} /> },
  calibration:     { title: "Calibration",  color: "#8a9ba3", unit: "",     icon: <Cpu size={18} /> },
};

export default function MetricDetailScreen() {
  const { metric } = useParams<{ metric: string }>();
  const store = useAppStore();
  const meta = METRIC_META[metric ?? ""] ?? { title: metric ?? "Metric", color: "#4CD964", unit: "", icon: null };

  return (
    <div className="min-h-dvh bg-goose-bg">
      <PageHeader title={meta.title} showBack />
      <div className="px-4 py-4 space-y-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}>
        {metric === "sleep" && <SleepDetail store={store} />}
        {metric === "recovery" && <RecoveryDetail store={store} />}
        {metric === "strain" && <StrainDetail store={store} />}
        {metric === "stress" && <StressDetail store={store} />}
        {metric === "cardioLoad" && <CardioLoadDetail store={store} />}
        {metric === "energyBank" && <EnergyBankDetail store={store} />}
        {metric === "healthMonitor" && <HealthMonitorDetail store={store} />}
        {metric === "algorithms" && <AlgorithmsDetail store={store} />}
        {metric === "packetInputs" && <PacketInputsDetail store={store} />}
        {!METRIC_META[metric ?? ""] && (
          <div className="card p-8 text-center">
            <p className="text-goose-muted">No detail view available for this metric yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-goose-border/40 last:border-0">
      <span className="text-sm text-goose-muted">{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={color ? { color } : { color: "#e8edef" }}>{value}</span>
    </div>
  );
}

function NoDataCard({ message }: { message: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-goose-muted text-sm">{message}</p>
    </div>
  );
}

function SleepDetail({ store }: { store: ReturnType<typeof useAppStore.getState> }) {
  const sleep = store.sleepDetail;
  if (!sleep) return <NoDataCard message="No sleep data. Connect your WHOOP to record sleep." />;

  const stageColors: Record<string, string> = { deep: "#4A90D9", rem: "#9B59B6", core: "#4CD964", awake: "#F39C12" };

  return (
    <>
      <div className="card p-5 text-center">
        <p className="text-xs text-goose-muted uppercase tracking-wider font-semibold mb-1">Sleep Performance</p>
        <p className="text-6xl font-bold text-goose-sleep tabular-nums">{sleep.scoreText}<span className="text-3xl">%</span></p>
        <p className="text-goose-muted text-sm mt-1">{sleep.qualityText}</p>
        <p className="text-xs text-goose-muted mt-0.5">{sleep.dateLabel}</p>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-3">Sleep Stages</p>
        <div className="flex rounded-lg overflow-hidden h-3 mb-4 gap-px">
          {sleep.stages.map((s) => {
            const total = sleep.stages.reduce((a, b) => a + b.durationMinutes, 0) || 1;
            return (
              <div
                key={s.id}
                style={{ width: `${(s.durationMinutes / total) * 100}%`, backgroundColor: stageColors[s.stage] ?? "#4CD964" }}
              />
            );
          })}
        </div>
        <div className="space-y-2">
          {sleep.stages.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stageColors[s.stage] ?? "#4CD964" }} />
              <span className="text-sm text-goose-muted capitalize flex-1">{s.stage}</span>
              <span className="text-sm font-medium text-goose-text tabular-nums">{formatMinutes(s.durationMinutes)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-1">Details</p>
        <StatRow label="Duration" value={sleep.durationText} />
        <StatRow label="Time in Bed" value={sleep.timeInBedText} />
        <StatRow label="Start" value={sleep.startLabel} />
        <StatRow label="End" value={sleep.endLabel} />
      </div>
    </>
  );
}

function RecoveryDetail({ store }: { store: ReturnType<typeof useAppStore.getState> }) {
  const rec = store.recovery;
  if (!rec) return <NoDataCard message="No recovery data. Connect WHOOP to compute recovery." />;

  const color = rec.score >= 67 ? "#4CD964" : rec.score >= 34 ? "#F0C43F" : "#E74C3C";

  return (
    <>
      <div className="card p-5 text-center">
        <p className="text-xs text-goose-muted uppercase tracking-wider font-semibold mb-1">Recovery</p>
        <p className="text-6xl font-bold tabular-nums" style={{ color }}>{rec.score}<span className="text-3xl">%</span></p>
        <p className="text-sm mt-1 font-medium" style={{ color }}>{rec.status}</p>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-1">Vitals</p>
        <StatRow label="HRV (RMSSD)" value={rec.hrv ? `${Math.round(rec.hrv)} ms` : "--"} color="#1ABC9C" />
        <StatRow label="Resting HR" value={rec.rhr ? `${Math.round(rec.rhr)} bpm` : "--"} color="#E74C3C" />
        <StatRow label="SpO2" value={rec.spo2 ? `${rec.spo2.toFixed(1)}%` : "--"} color="#4A90D9" />
        <StatRow label="Resp. Rate" value={rec.respiratoryRate ? `${rec.respiratoryRate.toFixed(1)} rpm` : "--"} color="#9B59B6" />
        <StatRow label="Skin Temp Δ" value={rec.skinTempDelta ? `${rec.skinTempDelta > 0 ? "+" : ""}${rec.skinTempDelta.toFixed(2)}°` : "--"} color="#E67E22" />
      </div>
    </>
  );
}

function StrainDetail({ store }: { store: ReturnType<typeof useAppStore.getState> }) {
  const activities = store.todayActivities;
  const totalStrain = activities.reduce((s, a) => s + a.strainScore, 0);

  return (
    <>
      <div className="card p-5 text-center">
        <p className="text-xs text-goose-muted uppercase tracking-wider font-semibold mb-1">Strain</p>
        <p className="text-6xl font-bold text-goose-strain tabular-nums">{totalStrain > 0 ? totalStrain.toFixed(1) : "--"}</p>
        <p className="text-goose-muted text-sm mt-1">/21 max</p>
      </div>

      {activities.length > 0 ? (
        <div className="card p-4">
          <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-3">Activities</p>
          {activities.map((act, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-goose-border/40 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-goose-strain/20 flex items-center justify-center">
                <Activity size={16} className="text-goose-strain" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-goose-text capitalize">{act.activityType}</p>
                <p className="text-xs text-goose-muted">{Math.round(act.durationMinutes)}m · avg {act.avgHeartRate} bpm · max {act.maxHeartRate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-goose-strain">{act.strainScore.toFixed(1)}</p>
                <p className="text-xs text-goose-muted">{act.caloriesBurned} cal</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <NoDataCard message="No activities today. Start a workout from the Home tab." />
      )}
    </>
  );
}

function StressDetail({ store }: { store: ReturnType<typeof useAppStore.getState> }) {
  const stress = store.stress;
  if (!stress.hasData) return <NoDataCard message="No stress data. Connect WHOOP to track real-time stress." />;

  const chartData = stress.windows.map((w) => ({ time: w.timeLabel, stress: w.stress, hr: w.averageHeartRate }));

  return (
    <>
      <div className="card p-5 text-center">
        <p className="text-xs text-goose-muted uppercase tracking-wider font-semibold mb-1">Stress Score</p>
        <p className="text-6xl font-bold text-goose-stress tabular-nums">{stress.score ?? "--"}</p>
        <p className="text-goose-stress text-sm mt-1">{stress.status}</p>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-3">Stress Over Time</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#8a9ba3" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#8a9ba3" }} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ backgroundColor: "#1a2226", border: "1px solid #2a373d", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="stress" stroke="#9B59B6" fill="#9B59B620" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-1">Zones</p>
        <StatRow label="High Stress" value={`${stress.highPercent}%`} color="#E74C3C" />
        <StatRow label="Moderate Stress" value={`${stress.mediumPercent}%`} color="#F0C43F" />
        <StatRow label="Low Stress" value={`${stress.lowPercent}%`} color="#4CD964" />
        <StatRow label="Avg Heart Rate" value={stress.averageHeartRate ? `${stress.averageHeartRate} bpm` : "--"} />
      </div>
    </>
  );
}

function CardioLoadDetail({ store }: { store: ReturnType<typeof useAppStore.getState> }) {
  const cardio = store.cardioLoad;
  if (!cardio.hasData) return <NoDataCard message="Log activities to build your cardio load history." />;

  const STATUS_COLORS: Record<string, string> = {
    Rest: "#8a9ba3", Detraining: "#4A90D9", Maintaining: "#4CD964",
    Productive: "#F0C43F", Peaking: "#FF6B35", Overtraining: "#E74C3C",
  };

  return (
    <>
      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-3">7-Day Load</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cardio.points}>
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "#8a9ba3" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8a9ba3" }} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ backgroundColor: "#1a2226", border: "1px solid #2a373d", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="load" radius={[4, 4, 0, 0]}>
                {cardio.points.map((p, i) => (
                  <Cell key={i} fill={STATUS_COLORS[p.status] ?? "#3498DB"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-1">Days by Status</p>
        {cardio.points.map((p) => (
          <StatRow key={p.id} label={p.dateLabel} value={`${p.load.toFixed(1)} · ${p.status}`} color={STATUS_COLORS[p.status] ?? "#8a9ba3"} />
        ))}
      </div>
    </>
  );
}

function EnergyBankDetail({ store }: { store: ReturnType<typeof useAppStore.getState> }) {
  const energy = store.energyBank;
  if (!energy.hasData) return <NoDataCard message="No energy data. Sleep and activity data needed." />;

  return (
    <>
      <div className="card p-5 text-center">
        <p className="text-xs text-goose-muted uppercase tracking-wider font-semibold mb-1">Energy Bank</p>
        <p className="text-6xl font-bold text-goose-energy tabular-nums">{energy.percent ?? "--"}<span className="text-3xl">%</span></p>
        <p className="text-goose-energy text-sm mt-1">{energy.status}</p>
        <div className="mt-4 h-2 bg-goose-border rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-goose-energy transition-all" style={{ width: `${energy.percent ?? 0}%` }} />
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-3">Energy Timeline</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={energy.points}>
              <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: "#8a9ba3" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#8a9ba3" }} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ backgroundColor: "#1a2226", border: "1px solid #2a373d", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="energy" stroke="#F39C12" fill="#F39C1220" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-1">Balance</p>
        <StatRow label="Sleep Charge" value={`+${energy.totalCharged}%`} color="#4CD964" />
        <StatRow label="Total Drained" value={`-${energy.totalDrained}%`} color="#E74C3C" />
        <StatRow label="Net Remaining" value={`${energy.percent}%`} color="#F39C12" />
      </div>
    </>
  );
}

function HealthMonitorDetail({ store }: { store: ReturnType<typeof useAppStore.getState> }) {
  return (
    <>
      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-1">Live Vitals</p>
        <StatRow label="Heart Rate" value={store.liveHR ? `${store.liveHR} bpm` : "--"} color="#E74C3C" />
        <StatRow label="HRV (RMSSD)" value={store.hrv.rmssd ? `${Math.round(store.hrv.rmssd)} ms` : "--"} color="#1ABC9C" />
        <StatRow label="SDNN" value={store.hrv.sdnn ? `${Math.round(store.hrv.sdnn)} ms` : "--"} color="#1ABC9C" />
        <StatRow label="PNN50" value={store.hrv.pnn50 ? `${store.hrv.pnn50.toFixed(1)}%` : "--"} color="#1ABC9C" />
        <StatRow label="HR Source" value={store.liveHRSource} />
        <StatRow label="RR Samples" value={`${store.hrv.sampleCount}`} />
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-1">Status</p>
        <StatRow label="BLE State" value={store.bleState} color={store.bleState === "ready" ? "#4CD964" : "#8a9ba3"} />
        <StatRow label="Device" value={store.device.name || "--"} />
        <StatRow label="Battery" value={store.device.batteryPercent ? `${store.device.batteryPercent}%` : "--"} />
        <StatRow label="Last Sync" value={store.device.lastSyncAt?.toLocaleTimeString() ?? "--"} />
      </div>
    </>
  );
}

function AlgorithmsDetail({ store }: { store: ReturnType<typeof useAppStore.getState> }) {
  return (
    <div className="card p-4 divide-y divide-goose-border/40">
      {store.algorithms.map((alg) => (
        <div key={alg.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-sm font-semibold text-goose-text">{alg.displayName}</p>
            <span className={clsx("badge", alg.status === "ready" ? "bg-goose-recovery/20 text-goose-recovery" : "bg-goose-border text-goose-muted")}>
              {alg.status}
            </span>
          </div>
          <p className="text-xs text-goose-muted">{alg.description}</p>
          <p className="text-[10px] text-goose-border mt-0.5 font-mono">{alg.id}</p>
        </div>
      ))}
    </div>
  );
}

function PacketInputsDetail({ store }: { store: ReturnType<typeof useAppStore.getState> }) {
  return (
    <>
      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-1">Packet Stats</p>
        <StatRow label="Total Packets" value={`${store.packetCount}`} />
        <StatRow label="BLE State" value={store.bleState} color={store.bleState === "ready" ? "#4CD964" : "#8a9ba3"} />
        <StatRow label="Sync Status" value={store.historicalSyncStatus} />
        <StatRow label="Live HR Source" value={store.liveHRSource} />
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-2">Recent Packets</p>
        <div className="max-h-80 overflow-y-auto font-mono space-y-1">
          {store.capturedPackets.length === 0 ? (
            <p className="text-xs text-goose-muted">No packets captured yet</p>
          ) : (
            store.capturedPackets.slice(0, 50).map((p, i) => (
              <div key={i} className="text-[10px] flex gap-2">
                <span className="text-goose-muted shrink-0">{p.timestamp.toLocaleTimeString()}</span>
                <span className="text-goose-cardio shrink-0">{p.charUUID.slice(0, 8)}</span>
                <span className="text-goose-text truncate">{p.data}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
