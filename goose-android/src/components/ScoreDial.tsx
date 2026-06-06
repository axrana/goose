import { clsx } from "clsx";

interface ScoreDialProps {
  title: string;
  value: string | number;
  unit?: string;
  color: string;
  score: number;
  subtitle?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export default function ScoreDial({
  title,
  value,
  unit,
  color,
  score,
  subtitle,
  onClick,
  size = "md",
}: ScoreDialProps) {
  const radius = size === "lg" ? 52 : size === "md" ? 44 : 34;
  const stroke = size === "lg" ? 6 : 5;
  const svgSize = (radius + stroke) * 2 + 4;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * Math.min(score, 100)) / 100;

  const fontSize = size === "lg" ? "text-3xl" : size === "md" ? "text-2xl" : "text-xl";
  const labelSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center gap-1 press-scale flex-1",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      <div className="relative flex items-center justify-center">
        <svg
          width={svgSize}
          height={svgSize}
          className="radial-progress"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#2a373d"
            strokeWidth={stroke}
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center leading-none">
          <span className={clsx("font-bold text-goose-text tabular-nums", fontSize)}>
            {value}
          </span>
          {unit && (
            <span className="text-[9px] text-goose-muted font-medium mt-0.5 uppercase">{unit}</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className={clsx("font-semibold text-goose-text", labelSize)}>{title}</p>
        {subtitle && (
          <p className={clsx("text-goose-muted mt-0.5", size === "sm" ? "text-[9px]" : "text-[10px]")}>
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
