import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import './styles.css';
import { auth } from '../lib/firebase';
import { useTheme } from '../hooks/useTheme';
import { parseRoute } from './router';
import type { NvRoute } from './router';
import { HomeScreen } from './screens/Home';
import { HistoryScreen } from './screens/History';
import { SimFlow } from './SimFlow';
import LoginModal from '../components/LoginModal';
import type { SimData } from './simState';
import { simDataFromHistory } from './simState';

export default function NovaVersaoApp() {
  const { theme, toggle } = useTheme();
  const [route, setRoute] = useState<NvRoute>(() => parseRoute(window.location.pathname));
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingLoad, setPendingLoad] = useState<SimData | null>(null);

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const navigate = (next: NvRoute) => {
    setRoute(next);
    window.scrollTo(0, 0);
  };

  return (
    <div className="nv" data-theme={theme}>
      <div className="nv-grain" aria-hidden="true" />
      {route.screen === 'home' && <HomeScreen theme={theme} onToggleTheme={toggle} onNavigate={navigate} user={user} />}
      {route.screen === 'history' && (
        <HistoryScreen
          theme={theme}
          onToggleTheme={toggle}
          onNavigate={navigate}
          user={user}
          onSelect={(sim) => {
            const loaded = simDataFromHistory(sim);
            setPendingLoad(loaded);
            navigate({ screen: 'result', mode: loaded.mode });
          }}
        />
      )}
      {route.screen !== 'home' && route.screen !== 'history' && (
        <SimFlow
          theme={theme}
          onToggleTheme={toggle}
          onNavigate={navigate}
          route={route}
          user={user}
          onRequireLogin={() => setShowLogin(true)}
          pendingLoad={pendingLoad}
          onConsumePendingLoad={() => setPendingLoad(null)}
        />
      )}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
      )}
    </div>
  );
}
