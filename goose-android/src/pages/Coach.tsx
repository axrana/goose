import { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";
import { Send, Trash2, Key } from "lucide-react";
import { clsx } from "clsx";
import { clearCoachMessages, saveCoachMessage } from "../db/database";

const QUICK_PROMPTS = [
  "How did I sleep last night?",
  "What's my recovery score today?",
  "Am I ready for a hard workout?",
  "How is my stress trending?",
  "What should I do to improve HRV?",
];

function buildSystemPrompt(store: ReturnType<typeof useAppStore.getState>): string {
  const parts = ["You are Goose, a WHOOP health data coach. Answer concisely based on the user's real data."];
  if (store.sleepDetail) {
    parts.push(`Sleep: ${store.sleepDetail.scoreText}% score, ${store.sleepDetail.durationText} duration, quality: ${store.sleepDetail.qualityText}.`);
  }
  if (store.recovery) {
    parts.push(`Recovery: ${store.recovery.score}% (${store.recovery.status}).`);
  }
  const strain = store.todayActivities.reduce((s, a) => s + a.strainScore, 0);
  if (strain > 0) parts.push(`Today's strain: ${strain.toFixed(1)}/21.`);
  if (store.liveHR) parts.push(`Current HR: ${store.liveHR} bpm.`);
  if (store.hrv.rmssd) parts.push(`HRV (RMSSD): ${Math.round(store.hrv.rmssd)} ms.`);
  if (store.stress.score !== null) parts.push(`Stress score: ${store.stress.score}/100 (${store.stress.status}).`);
  if (store.energyBank.percent !== null) parts.push(`Energy bank: ${store.energyBank.percent}%.`);
  return parts.join(" ");
}

async function sendToOpenAI(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 300 }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "No response";
}

export default function CoachScreen() {
  const store = useAppStore();
  const [input, setInput] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [store.coachMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setInput("");

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: text.trim(),
      timestamp: new Date(),
    };
    store.addCoachMessage(userMsg);
    await saveCoachMessage(userMsg);

    if (!store.openAIKey) {
      const botMsg = {
        id: `bot-${Date.now()}`,
        role: "assistant" as const,
        content: "Please add your OpenAI API key in the More tab to enable Coach AI. Your key is stored only on this device.",
        timestamp: new Date(),
      };
      store.addCoachMessage(botMsg);
      return;
    }

    store.setCoachLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(store);
      const history = [
        { role: "system", content: systemPrompt },
        ...store.coachMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text.trim() },
      ];
      const reply = await sendToOpenAI(history, store.openAIKey);
      const botMsg = {
        id: `bot-${Date.now()}`,
        role: "assistant" as const,
        content: reply,
        timestamp: new Date(),
      };
      store.addCoachMessage(botMsg);
      await saveCoachMessage(botMsg);
    } catch (err) {
      const errMsg = {
        id: `err-${Date.now()}`,
        role: "assistant" as const,
        content: `Error: ${err instanceof Error ? err.message : "Failed to reach Coach"}`,
        timestamp: new Date(),
      };
      store.addCoachMessage(errMsg);
    } finally {
      store.setCoachLoading(false);
    }
  };

  const handleClear = async () => {
    store.clearCoachMessages();
    await clearCoachMessages();
  };

  return (
    <div className="flex flex-col min-h-dvh bg-goose-bg">
      <PageHeader
        title="Coach"
        subtitle={store.openAIKey ? "AI-powered · OpenAI" : "Add API key to enable AI"}
        rightElement={
          <div className="flex gap-2">
            <button onClick={() => setShowKeyInput(!showKeyInput)} className="w-8 h-8 rounded-full bg-goose-card flex items-center justify-center press-scale">
              <Key size={14} className="text-goose-muted" />
            </button>
            <button onClick={handleClear} className="w-8 h-8 rounded-full bg-goose-card flex items-center justify-center press-scale">
              <Trash2 size={14} className="text-goose-muted" />
            </button>
          </div>
        }
      />

      {showKeyInput && (
        <div className="px-4 py-3 bg-goose-card border-b border-goose-border">
          <p className="text-xs text-goose-muted mb-2">OpenAI API Key (stored on device only)</p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="sk-..."
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              className="flex-1 bg-goose-bg border border-goose-border rounded-xl px-3 py-2 text-sm text-goose-text placeholder-goose-muted focus:outline-none focus:border-goose-recovery"
            />
            <button
              onClick={() => { store.setOpenAIKey(keyDraft); setShowKeyInput(false); }}
              className="btn-primary text-sm px-4 py-2"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 8 }}>
        {store.coachMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="w-16 h-16 rounded-2xl bg-goose-recovery/10 flex items-center justify-center">
              <span className="text-3xl">🧠</span>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-goose-text text-lg mb-1">Coach</h3>
              <p className="text-sm text-goose-muted">
                Ask me anything about your health data, recovery, training, or sleep.
              </p>
            </div>
            <div className="w-full space-y-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="w-full text-left px-4 py-3 bg-goose-card rounded-xl text-sm text-goose-text press-scale border border-goose-border hover:border-goose-recovery/40 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {store.coachMessages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={clsx(
                    "max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-goose-recovery text-black font-medium rounded-br-md"
                      : "bg-goose-card text-goose-text rounded-bl-md border border-goose-border"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {store.isCoachLoading && (
              <div className="flex justify-start">
                <div className="bg-goose-card px-4 py-3 rounded-2xl rounded-bl-md border border-goose-border">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-goose-muted animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div
        className="px-4 py-3 bg-goose-bg border-t border-goose-border"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)" }}
      >
        <div className="flex gap-2 items-end">
          <input
            type="text"
            placeholder="Ask about your health data…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            className="flex-1 bg-goose-card border border-goose-border rounded-xl px-4 py-3 text-sm text-goose-text placeholder-goose-muted focus:outline-none focus:border-goose-recovery transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || store.isCoachLoading}
            className={clsx(
              "w-11 h-11 rounded-xl flex items-center justify-center press-scale transition-colors",
              input.trim() && !store.isCoachLoading
                ? "bg-goose-recovery text-black"
                : "bg-goose-card text-goose-muted"
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
