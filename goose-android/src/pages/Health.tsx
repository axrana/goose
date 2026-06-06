import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";
import { ChevronRight, Moon, Heart, Activity, Zap, TrendingUp, Battery, BarChart2, Cpu, AlignLeft } from "lucide-react";
import { clsx } from "clsx";

interface MetricRow {
  id: string;
  label: string;
  value: string;
  unit?: string;
  color: string;
  icon: React.ReactNode;
  status?: string;
}

export default function HealthScreen() {
  const navigate = useNavigate();
  const store = useAppStore();

  const sleepScore = store.sleepDetail ? `${store.sleepDetail.scoreText}%` : "--";
  const recoveryScore = store.recovery ? `${store.recovery.score}%` : "--";
  const strainScore = store.todayActivities.reduce((s, a) => s + a.strainScore, 0);
  const strainDisplay = strainScore > 0 ? strainScore.toFixed(1) : "--";
  const stressScore = store.stress.score !== null ? `${store.stress.score}` : "--";
  const energyPercent = store.energyBank.percent !== null ? `${store.energyBank.percent}%` : "--";

  const sections: { title: string; items: MetricRow[] }[] = [
    {
      title: "Today",
      items: [
        {
          id: "sleep",
          label: "Sleep",
          value: sleepScore,
          color: "#4A90D9",
          icon: <Moon size={16} />,
          status: store.sleepDetail?.qualityText,
        },
        {
          id: "recovery",
          label: "Recovery",
          value: recoveryScore,
          color: store.recovery
            ? store.recovery.score >= 67 ? "#4CD964" : store.recovery.score >= 34 ? "#F0C43F" : "#E74C3C"
            : "#4a5568",
          icon: <Heart size={16} />,
          status: store.recovery?.status,
        },
        {
          id: "strain",
          label: "Strain",
          value: strainDisplay,
          unit: strainScore > 0 ? "/21" : undefined,
          color: "#FF6B35",
          icon: <Activity size={16} />,
          status: strainScore < 8 ? "Light" : strainScore < 14 ? "Moderate" : "High",
        },
      ],
    },
    {
      title: "Vitals",
      items: [
        {
          id: "healthMonitor",
          label: "Health Monitor",
          value: store.liveHR ? `${store.liveHR}` : "--",
          unit: store.liveHR ? "bpm" : undefined,
          color: "#E74C3C",
          icon: <Heart size={16} />,
          status: store.liveHR ? "Live" : "No data",
        },
        {
          id: "stress",
          label: "Stress",
          value: stressScore,
          color: "#9B59B6",
          icon: <Zap size={16} />,
          status: store.stress.status,
        },
        {
          id: "cardioLoad",
          label: "Cardio Load",
          value: store.cardioLoad.hasData
            ? `${store.cardioLoad.points[store.cardioLoad.points.length - 1]?.load.toFixed(1) ?? "--"}`
            : "--",
          color: "#3498DB",
          icon: <TrendingUp size={16} />,
          status: store.cardioLoad.status,
        },
        {
          id: "energyBank",
          label: "Energy Bank",
          value: energyPercent,
          color: "#F39C12",
          icon: <Battery size={16} />,
          status: store.energyBank.status,
        },
      ],
    },
    {
      title: "Data & Algorithms",
      items: [
        {
          id: "packetInputs",
          label: "Packet Inputs",
          value: `${store.packetCount}`,
          unit: "pkts",
          color: "#8a9ba3",
          icon: <BarChart2 size={16} />,
          status: store.bleState === "ready" ? "Live" : "Idle",
        },
        {
          id: "algorithms",
          label: "Algorithms",
          value: `${store.algorithms.filter((a) => a.status === "ready").length}`,
          unit: "active",
          color: "#8a9ba3",
          icon: <Cpu size={16} />,
          status: "Running",
        },
        {
          id: "referenceComparisons",
          label: "Reference",
          value: "--",
          color: "#8a9ba3",
          icon: <AlignLeft size={16} />,
        },
      ],
    },
  ];

  return (
    <div className="min-h-dvh bg-goose-bg">
      <PageHeader title="Health" />
      <div className="px-4 py-4 space-y-6" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}>
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-goose-muted uppercase tracking-wider mb-2 px-1">
              {section.title}
            </p>
            <div className="card overflow-hidden divide-y divide-goose-border/50">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/health/${item.id}`)}
                  className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-goose-cardHover press-scale transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <span style={{ color: item.color }}>{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-goose-text">{item.label}</p>
                    {item.status && (
                      <p className="text-xs text-goose-muted truncate">{item.status}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-base font-bold text-goose-text tabular-nums">{item.value}</span>
                      {item.unit && (
                        <span className="text-xs text-goose-muted ml-1">{item.unit}</span>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-goose-muted" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
