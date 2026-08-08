import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_CONTAINER_SELECTORS = [
  '.client-main-scrollable-content-container',
  '.admin-main-scrollable-content-container',
];

const getScrollContainer = (): HTMLElement | Window => {
  for (const selector of SCROLL_CONTAINER_SELECTORS) {
    const element = document.querySelector<HTMLElement>(selector);

    if (element) {
      return element;
    }
  }

  return window;
};

const getScrollTop = (container: HTMLElement | Window) => (
  container instanceof Window ? window.scrollY : container.scrollTop
);

const scrollToTop = (container: HTMLElement | Window, top: number) => {
  container.scrollTo({
    top,
    left: 0,
    behavior: 'auto',
  });
};

const getLocationPathKey = (pathname: string, search: string) => `${pathname}${search}`;

interface ScrollRestorationLocationState {
  restoreScroll?: boolean;
}

const ScrollRestoration: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositionsByLocationKeyRef = useRef<Record<string, number>>({});
  const scrollPositionsByPathRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const container = getScrollContainer();
    const locationKey = location.key;
    const pathKey = getLocationPathKey(location.pathname, location.search);

    const saveScrollPosition = () => {
      const scrollTop = getScrollTop(container);
      scrollPositionsByLocationKeyRef.current[locationKey] = scrollTop;
      scrollPositionsByPathRef.current[pathKey] = scrollTop;
    };

    container.addEventListener('scroll', saveScrollPosition, { passive: true });

    return () => {
      saveScrollPosition();
      container.removeEventListener('scroll', saveScrollPosition);
    };
  }, [location.key, location.pathname, location.search]);

  useLayoutEffect(() => {
    const container = getScrollContainer();
    const pathKey = getLocationPathKey(location.pathname, location.search);
    const shouldRestoreByPath = !!(
      location.state as ScrollRestorationLocationState | null
    )?.restoreScroll;
    const nextScrollTop = navigationType === 'POP'
      ? scrollPositionsByLocationKeyRef.current[location.key] || 0
      : scrollPositionsByPathRef.current[pathKey] || 0;
    const scrollTop = shouldRestoreByPath || navigationType === 'POP' ? nextScrollTop : 0;

    window.requestAnimationFrame(() => {
      scrollToTop(container, scrollTop);
    });

    const restoreTimer = window.setTimeout(() => {
      scrollToTop(getScrollContainer(), scrollTop);
    }, 100);

    return () => {
      window.clearTimeout(restoreTimer);
    };
  }, [location.key, location.pathname, location.search, location.state, navigationType]);

  return null;
};

export default ScrollRestoration;
