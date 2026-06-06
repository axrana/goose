import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useBLE } from "./hooks/useBLE";
import TabBar from "./components/TabBar";
import HomeScreen from "./pages/Home";
import HealthScreen from "./pages/Health";
import CoachScreen from "./pages/Coach";
import MoreScreen from "./pages/More";
import OnboardingScreen from "./pages/Onboarding";
import ActivityScreen from "./pages/Activity";
import MetricDetailScreen from "./pages/MetricDetail";
import { useAppStore } from "./store/useAppStore";

function AppShell() {
  useBLE();
  const profile = useAppStore((s) => s.userProfile);
  const hasCompletedOnboarding = !!profile.name;

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <div className="flex flex-col min-h-dvh bg-goose-bg">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/health" element={<HealthScreen />} />
          <Route path="/health/:metric" element={<MetricDetailScreen />} />
          <Route path="/coach" element={<CoachScreen />} />
          <Route path="/more" element={<MoreScreen />} />
          <Route path="/activity" element={<ActivityScreen />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
