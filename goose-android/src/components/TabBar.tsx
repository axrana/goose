import { useNavigate, useLocation } from "react-router-dom";
import { Home, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { clsx } from "clsx";

const TABS = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/health", label: "Health", icon: Heart },
  { path: "/coach", label: "Coach", icon: MessageCircle },
  { path: "/more", label: "More", icon: MoreHorizontal },
];

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="tab-bar z-50">
      <div className="flex items-stretch justify-around h-14 px-2">
        {TABS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 flex-1 px-2 press-scale transition-colors",
                isActive ? "text-goose-recovery" : "text-goose-muted"
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="transition-all"
              />
              <span className={clsx("text-[10px] font-medium transition-all", isActive ? "text-goose-recovery" : "text-goose-muted")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
