import { clsx } from "clsx";
import { ChevronRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  status?: string;
  color?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  status,
  color = "#4CD964",
  icon,
  onClick,
  className,
  children,
}: MetricCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={clsx(
        "card p-4 text-left w-full",
        onClick && "press-scale cursor-pointer hover:bg-goose-cardHover transition-colors",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <span style={{ color }}>{icon}</span>
            </div>
          )}
          <span className="text-xs font-semibold text-goose-muted uppercase tracking-wider">
            {title}
          </span>
        </div>
        {onClick && <ChevronRight size={16} className="text-goose-muted mt-0.5" />}
      </div>

      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-bold text-goose-text tabular-nums leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-goose-muted mb-0.5 font-medium">{unit}</span>
        )}
      </div>

      {status && (
        <p className="text-xs mt-1.5 font-medium" style={{ color }}>
          {status}
        </p>
      )}

      {subtitle && (
        <p className="text-xs text-goose-muted mt-1">{subtitle}</p>
      )}

      {children && <div className="mt-3">{children}</div>}
    </Wrapper>
  );
}
