import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { clsx } from "clsx";
import { Activity } from "lucide-react";

const STEPS = ["welcome", "name", "body", "done"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const setUserProfile = useAppStore((s) => s.setUserProfile);

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const finish = () => {
    setUserProfile({
      name: name.trim() || "Athlete",
      age: age ? parseInt(age) : null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      gender: (gender as "male" | "female" | "other") || null,
      maxHeartRate: age ? Math.round(208 - 0.7 * parseInt(age)) : null,
      restingHeartRate: null,
    });
  };

  return (
    <div className="min-h-dvh bg-goose-bg flex flex-col items-center justify-between px-6 py-12 safe-top">
      <div className="w-full max-w-sm flex flex-col gap-8 flex-1 justify-center">
        {step === "welcome" && (
          <div className="animate-fade-in text-center flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-goose-recovery/10 flex items-center justify-center">
              <Activity size={48} className="text-goose-recovery" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-goose-text mb-3">Goose</h1>
              <p className="text-goose-muted text-base leading-relaxed">
                Your local-first WHOOP companion. Pair your strap to track recovery, sleep, strain, and more — all on-device.
              </p>
            </div>
            <button onClick={next} className="btn-primary w-full text-center mt-4">
              Get Started
            </button>
          </div>
        )}

        {step === "name" && (
          <div className="animate-fade-in flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-goose-text mb-1">What's your name?</h2>
              <p className="text-goose-muted text-sm">This is used to personalize your dashboard.</p>
            </div>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-goose-card border border-goose-border rounded-xl px-4 py-3.5 text-goose-text placeholder-goose-muted focus:outline-none focus:border-goose-recovery transition-colors text-base"
              autoFocus
            />
            <button
              onClick={next}
              disabled={!name.trim()}
              className={clsx("btn-primary w-full text-center", !name.trim() && "opacity-40")}
            >
              Continue
            </button>
          </div>
        )}

        {step === "body" && (
          <div className="animate-fade-in flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-goose-text mb-1">Body stats</h2>
              <p className="text-goose-muted text-sm">Used to compute HR zones and metrics.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-goose-muted uppercase tracking-wider font-medium block mb-1.5">Age</label>
                <input
                  type="number"
                  placeholder="e.g. 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-goose-card border border-goose-border rounded-xl px-4 py-3 text-goose-text placeholder-goose-muted focus:outline-none focus:border-goose-recovery transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-goose-muted uppercase tracking-wider font-medium block mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-goose-card border border-goose-border rounded-xl px-4 py-3 text-goose-text placeholder-goose-muted focus:outline-none focus:border-goose-recovery transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-goose-muted uppercase tracking-wider font-medium block mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-goose-card border border-goose-border rounded-xl px-4 py-3 text-goose-text placeholder-goose-muted focus:outline-none focus:border-goose-recovery transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-goose-muted uppercase tracking-wider font-medium block mb-1.5">Biological Sex</label>
                <div className="flex gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={clsx(
                        "flex-1 py-3 rounded-xl text-sm font-medium transition-colors capitalize",
                        gender === g
                          ? "bg-goose-recovery text-black"
                          : "bg-goose-card border border-goose-border text-goose-muted"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={next} className="btn-primary w-full text-center">
              Continue
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="animate-fade-in text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-goose-recovery/10 flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-goose-text mb-2">
                Ready, {name.trim() || "Athlete"}
              </h2>
              <p className="text-goose-muted text-sm leading-relaxed">
                Connect your WHOOP strap from the Home screen to start recording data.
              </p>
            </div>
            <button onClick={finish} className="btn-primary w-full text-center">
              Open Goose
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-8">
        {STEPS.map((s) => (
          <div
            key={s}
            className={clsx(
              "h-1.5 rounded-full transition-all",
              s === step ? "w-6 bg-goose-recovery" : "w-1.5 bg-goose-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}
