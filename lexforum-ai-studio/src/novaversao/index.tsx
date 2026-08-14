import React, { useEffect, useState } from 'react';
import './styles.css';
import { useTheme } from '../hooks/useTheme';
import { parseRoute } from './router';
import type { NvRoute } from './router';
import { HomeScreen } from './screens/Home';
import { PlaceholderScreen } from './screens/Placeholder';

export default function NovaVersaoApp() {
  const { theme, toggle } = useTheme();
  const [route, setRoute] = useState<NvRoute>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (next: NvRoute) => {
    setRoute(next);
    window.scrollTo(0, 0);
  };

  return (
    <div className="nv" data-theme={theme}>
      <div className="nv-grain" aria-hidden="true" />
      {route.screen === 'home' && <HomeScreen theme={theme} onToggleTheme={toggle} onNavigate={navigate} />}
      {route.screen !== 'home' && (
        <PlaceholderScreen theme={theme} onToggleTheme={toggle} onNavigate={navigate} route={route} />
      )}
    </div>
  );
}
