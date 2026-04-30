import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { scrollVisibleContentToTop } from "./scrollToTop";
import { createScrollToTopStore, type ScrollToTopAction } from "./scrollToTopStore";

type ScrollToTopRegistryValue = {
  registerScrollToTop: (routeKey: string, action: ScrollToTopAction) => () => void;
  scrollToTop: (routeKey: string) => boolean;
  requestScrollToTop: (routeKey: string) => void;
  consumeScrollToTopRequest: (routeKey: string) => boolean;
};

const ScrollToTopRegistryContext = createContext<ScrollToTopRegistryValue | null>(null);

export function ScrollToTopProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef(createScrollToTopStore(() => scrollVisibleContentToTop({})));

  const registerScrollToTop = useCallback(
    (routeKey: string, action: ScrollToTopAction) => storeRef.current.registerScrollToTop(routeKey, action),
    []
  );

  const scrollToTop = useCallback((routeKey: string) => storeRef.current.scrollToTop(routeKey), []);

  const requestScrollToTop = useCallback((routeKey: string) => {
    storeRef.current.requestScrollToTop(routeKey);
  }, []);

  const consumeScrollToTopRequest = useCallback(
    (routeKey: string) => storeRef.current.consumeScrollToTopRequest(routeKey),
    []
  );

  const value = useMemo(
    () => ({ registerScrollToTop, scrollToTop, requestScrollToTop, consumeScrollToTopRequest }),
    [consumeScrollToTopRequest, registerScrollToTop, requestScrollToTop, scrollToTop]
  );

  return (
    <ScrollToTopRegistryContext.Provider value={value}>
      {children}
    </ScrollToTopRegistryContext.Provider>
  );
}

export function useScrollToTopRegistry() {
  const context = useContext(ScrollToTopRegistryContext);
  if (!context) {
    throw new Error("useScrollToTopRegistry must be used within ScrollToTopProvider");
  }

  return context;
}
