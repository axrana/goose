import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, showBack, rightElement }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className="sticky top-0 z-40 px-4 py-3 bg-goose-bg/90 backdrop-blur-md border-b border-goose-border/40"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-goose-card press-scale"
            >
              <ArrowLeft size={18} className="text-goose-text" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-goose-text leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-goose-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {rightElement && <div>{rightElement}</div>}
      </div>
    </div>
  );
}
