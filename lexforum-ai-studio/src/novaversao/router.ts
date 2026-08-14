/**
 * Roteador mínimo para /novaversao — sem lib de router (o produto inteiro
 * não usa uma; ver App.tsx:1177, o mesmo padrão de window.location.pathname
 * usado por /termos e /admin).
 *
 * Todo link é um <a href> real: funciona com reload cheio sem JS (o Express
 * já serve index.html para qualquer caminho) e é interceptado com
 * pushState quando JS está vivo — mesmo padrão à prova de falha do
 * briefing §10.2 (nunca <div onClick> como único caminho de navegação).
 */

export type NvRoute =
  | { screen: 'home' }
  | { screen: 'input'; mode: number }
  | { screen: 'confirm'; mode: number }
  | { screen: 'simulating'; mode: number }
  | { screen: 'result'; mode: number };

const BASE = '/novaversao';

export function parseRoute(pathname: string): NvRoute {
  const rest = pathname.slice(BASE.length).replace(/^\/|\/$/g, '');
  const parts = rest.split('/').filter(Boolean);

  if (parts[0] === 'simular' && parts[1]) {
    const mode = Number(parts[1]);
    if (Number.isInteger(mode) && mode >= 1 && mode <= 5) {
      const sub = parts[2];
      if (sub === 'confirmar') return { screen: 'confirm', mode };
      if (sub === 'processando') return { screen: 'simulating', mode };
      if (sub === 'resultado') return { screen: 'result', mode };
      return { screen: 'input', mode };
    }
  }
  return { screen: 'home' };
}

export function routePath(route: NvRoute): string {
  if (route.screen === 'home') return BASE;
  const p = `${BASE}/simular/${route.mode}`;
  if (route.screen === 'input') return p;
  if (route.screen === 'confirm') return `${p}/confirmar`;
  if (route.screen === 'simulating') return `${p}/processando`;
  return `${p}/resultado`;
}
