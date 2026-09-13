import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { NvRoute } from './router';
import { initialSimData } from './simState';
import type { SimData } from './simState';
import { InputScreen } from './screens/Input';
import { ConfirmScreen } from './screens/Confirm';
import { SimulatingScreen } from './screens/Simulating';
import { ResultScreen } from './screens/Result';

interface SimFlowProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: NvRoute) => void;
  route: Extract<NvRoute, { mode: number }>;
  user: User | null;
  onRequireLogin: () => void;
  pendingLoad: SimData | null;
  onConsumePendingLoad: () => void;
}

/** Owns the form/session data for one simulation across the four screens
 * (Input → Confirm → Simulating → Result). Resets when the user switches
 * to a different mode from the home page. */
export const SimFlow: React.FC<SimFlowProps> = ({ theme, onToggleTheme, onNavigate, route, user, onRequireLogin, pendingLoad, onConsumePendingLoad }) => {
  const [simData, setSimData] = useState<SimData>(() => pendingLoad ?? initialSimData(route.mode));

  useEffect(() => {
    if (pendingLoad) onConsumePendingLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSimData((prev) => (prev.mode === route.mode ? prev : initialSimData(route.mode)));
  }, [route.mode]);

  if (route.screen === 'input') {
    return <InputScreen theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} simData={simData} setSimData={setSimData} user={user} />;
  }
  if (route.screen === 'confirm') {
    return <ConfirmScreen theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} simData={simData} user={user} />;
  }
  if (route.screen === 'simulating') {
    return <SimulatingScreen theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} simData={simData} setSimData={setSimData} user={user} />;
  }
  return (
    <ResultScreen
      theme={theme}
      onToggleTheme={onToggleTheme}
      onNavigate={onNavigate}
      simData={simData}
      setSimData={setSimData}
      user={user}
      onRequireLogin={onRequireLogin}
    />
  );
};
