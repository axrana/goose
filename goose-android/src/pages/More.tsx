import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useBLE } from "../hooks/useBLE";
import PageHeader from "../components/PageHeader";
import {
  Bluetooth, BluetoothOff, Battery, User, Activity, BarChart2,
  Download, Bug, RefreshCw, ChevronRight, Wifi, WifiOff, Clock, Cpu
} from "lucide-react";
import { clsx } from "clsx";

function DeviceSection() {
  const store = useAppStore();
  const { connectDevice, disconnectDevice, syncHistorical } = useBLE();
  const { isSupported } = useBLE();
  const isConnected = store.bleState === "ready" || store.bleState === "connected";

  return (
    <div>
      <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-2 px-1">Device</p>
      <div className="card overflow-hidden divide-y divide-goose-border/50">
        <div className="px-4 py-4 flex items-center gap-3">
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", isConnected ? "bg-goose-recovery/20" : "bg-goose-border")}>
            {isConnected ? <Bluetooth size={18} className="text-goose-recovery" /> : <BluetoothOff size={18} className="text-goose-muted" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-goose-text">{store.device.name || "WHOOP"}</p>
            <p className="text-xs text-goose-muted capitalize">{store.bleState}</p>
          </div>
          {isConnected ? (
            <button onClick={disconnectDevice} className="btn-secondary text-xs py-1.5 px-3">Disconnect</button>
          ) : (
            <button onClick={connectDevice} disabled={!isSupported} className={clsx("btn-primary text-xs py-1.5 px-3", !isSupported && "opacity-40")}>
              Connect
            </button>
          )}
        </div>

        {isConnected && (
          <>
            <Row icon={<Battery size={16} />} label="Battery" value={store.device.batteryPercent ? `${store.device.batteryPercent}%${store.device.batteryCharging ? " ⚡" : ""}` : "--"} />
            <Row icon={<Cpu size={16} />} label="Firmware" value={store.device.firmwareVersion ?? "--"} />
            <Row icon={<Wifi size={16} />} label="Model" value={store.device.modelNumber ?? "--"} />
            <Row icon={<Clock size={16} />} label="Connected" value={store.device.connectedAt?.toLocaleTimeString() ?? "--"} />
            <button
              onClick={syncHistorical}
              disabled={store.isHistoricalSyncing}
              className="flex items-center gap-3 px-4 py-3.5 w-full text-left press-scale"
            >
              <div className="w-9 h-9 rounded-xl bg-goose-cardio/20 flex items-center justify-center">
                <RefreshCw size={16} className={clsx("text-goose-cardio", store.isHistoricalSyncing && "animate-spin")} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-goose-text">Historical Sync</p>
                <p className="text-xs text-goose-muted">{store.historicalSyncStatus}</p>
              </div>
              <ChevronRight size={16} className="text-goose-muted" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileSection() {
  const store = useAppStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(store.userProfile);

  const save = () => {
    store.setUserProfile(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div>
        <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-2 px-1">Profile</p>
        <div className="card p-4 space-y-3">
          <InputField label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <InputField label="Age" value={draft.age?.toString() ?? ""} type="number" onChange={(v) => setDraft({ ...draft, age: v ? parseInt(v) : null })} />
          <div className="flex gap-3">
            <InputField label="Height (cm)" value={draft.height?.toString() ?? ""} type="number" onChange={(v) => setDraft({ ...draft, height: v ? parseFloat(v) : null })} />
            <InputField label="Weight (kg)" value={draft.weight?.toString() ?? ""} type="number" onChange={(v) => setDraft({ ...draft, weight: v ? parseFloat(v) : null })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditing(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button onClick={save} className="btn-primary flex-1 text-sm">Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-2 px-1">Profile</p>
      <div className="card overflow-hidden divide-y divide-goose-border/50">
        <button onClick={() => setEditing(true)} className="flex items-center gap-3 px-4 py-4 w-full press-scale">
          <div className="w-10 h-10 rounded-full bg-goose-recovery/20 flex items-center justify-center">
            <User size={18} className="text-goose-recovery" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-goose-text">{store.userProfile.name || "Athlete"}</p>
            <p className="text-xs text-goose-muted">
              {[
                store.userProfile.age && `${store.userProfile.age}y`,
                store.userProfile.height && `${store.userProfile.height}cm`,
                store.userProfile.weight && `${store.userProfile.weight}kg`,
              ].filter(Boolean).join(" · ") || "Tap to edit profile"}
            </p>
          </div>
          <ChevronRight size={16} className="text-goose-muted" />
        </button>
        <Row label="Max HR" value={store.userProfile.maxHeartRate ? `${store.userProfile.maxHeartRate} bpm` : "--"} icon={<Activity size={16} />} />
        <Row label="Resting HR" value={store.userProfile.restingHeartRate ? `${store.userProfile.restingHeartRate} bpm` : "--"} icon={<Activity size={16} />} />
      </div>
    </div>
  );
}

function DeveloperSection() {
  const store = useAppStore();
  const [showLogs, setShowLogs] = useState(false);
  const [showPackets, setShowPackets] = useState(false);

  return (
    <div>
      <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-2 px-1">Developer Tools</p>
      <div className="card overflow-hidden divide-y divide-goose-border/50">
        <button onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-3 px-4 py-3.5 w-full press-scale text-left">
          <div className="w-9 h-9 rounded-xl bg-goose-border flex items-center justify-center">
            <Bug size={16} className="text-goose-muted" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-goose-text">BLE Logs</p>
            <p className="text-xs text-goose-muted">{store.logs.length} messages</p>
          </div>
          <ChevronRight size={16} className={clsx("text-goose-muted transition-transform", showLogs && "rotate-90")} />
        </button>
        {showLogs && (
          <div className="bg-goose-bg max-h-64 overflow-y-auto px-4 py-2 font-mono">
            {store.logs.length === 0 ? (
              <p className="text-xs text-goose-muted py-2">No logs yet</p>
            ) : (
              store.logs.slice(0, 100).map((log) => (
                <div key={log.id} className="text-[10px] py-0.5 flex gap-2">
                  <span className={clsx(
                    "font-medium w-8 shrink-0",
                    log.level === "error" ? "text-goose-hr" : log.level === "warn" ? "text-goose-energy" : "text-goose-muted"
                  )}>{log.level}</span>
                  <span className="text-goose-muted shrink-0">{log.source}</span>
                  <span className="text-goose-text truncate">{log.title} {log.body}</span>
                </div>
              ))
            )}
          </div>
        )}

        <button onClick={() => setShowPackets(!showPackets)} className="flex items-center gap-3 px-4 py-3.5 w-full press-scale text-left">
          <div className="w-9 h-9 rounded-xl bg-goose-border flex items-center justify-center">
            <BarChart2 size={16} className="text-goose-muted" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-goose-text">Packet Capture</p>
            <p className="text-xs text-goose-muted">{store.packetCount} packets total</p>
          </div>
          <ChevronRight size={16} className={clsx("text-goose-muted transition-transform", showPackets && "rotate-90")} />
        </button>
        {showPackets && (
          <div className="bg-goose-bg max-h-64 overflow-y-auto px-4 py-2 font-mono">
            {store.capturedPackets.length === 0 ? (
              <p className="text-xs text-goose-muted py-2">No packets captured</p>
            ) : (
              store.capturedPackets.slice(0, 50).map((p, i) => (
                <div key={i} className="text-[10px] py-0.5">
                  <span className="text-goose-muted">{p.timestamp.toLocaleTimeString()} </span>
                  <span className="text-goose-cardio">{p.charUUID.slice(0, 8)} </span>
                  <span className="text-goose-text">{p.data.slice(0, 40)}</span>
                </div>
              ))
            )}
          </div>
        )}

        <button
          onClick={() => {
            const data = {
              profile: store.userProfile,
              hrv: store.hrv,
              sleep: store.sleepDetail,
              recovery: store.recovery,
              stress: store.stress,
              packetCount: store.packetCount,
              exportedAt: new Date().toISOString(),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `goose-export-${Date.now()}.json`;
            a.click();
          }}
          className="flex items-center gap-3 px-4 py-3.5 w-full press-scale text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-goose-border flex items-center justify-center">
            <Download size={16} className="text-goose-muted" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-goose-text">Export Data</p>
            <p className="text-xs text-goose-muted">Download JSON snapshot</p>
          </div>
          <ChevronRight size={16} className="text-goose-muted" />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-goose-border flex items-center justify-center">
          <span className="text-goose-muted">{icon}</span>
        </div>
      )}
      <p className="text-sm text-goose-muted flex-1">{label}</p>
      <p className="text-sm font-medium text-goose-text tabular-nums">{value}</p>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex-1">
      <label className="text-xs text-goose-muted mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-goose-bg border border-goose-border rounded-xl px-3 py-2.5 text-sm text-goose-text focus:outline-none focus:border-goose-recovery"
      />
    </div>
  );
}

export default function MoreScreen() {
  return (
    <div className="min-h-dvh bg-goose-bg">
      <PageHeader title="More" />
      <div className="px-4 py-4 space-y-6" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}>
        <DeviceSection />
        <ProfileSection />
        <DeveloperSection />
        <div className="text-center pt-4">
          <p className="text-xs text-goose-muted">Goose for WHOOP · Android</p>
          <p className="text-xs text-goose-border mt-1">Local-first · All data stored on-device</p>
        </div>
      </div>
    </div>
  );
}
