import React from 'react';
import type { NvRoute } from '../router';
import { routePath } from '../router';

interface NvLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
  to: NvRoute;
  onNavigate: (route: NvRoute) => void;
  children: React.ReactNode;
}

/** Real <a href>: works on full reload with no JS. Enhanced with
 * pushState for an instant transition when JS is alive. */
export const NvLink: React.FC<NvLinkProps> = ({ to, onNavigate, children, ...rest }) => {
  const href = routePath(to);
  return (
    <a
      {...rest}
      href={href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        window.history.pushState({}, '', href);
        onNavigate(to);
      }}
    >
      {children}
    </a>
  );
};
