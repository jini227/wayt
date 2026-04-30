export type ScrollToTopAction = () => void;

export function createScrollToTopStore(fallbackScrollToTop: () => boolean = () => false) {
  const actions = new Map<string, ScrollToTopAction>();
  const pendingRouteKeys = new Set<string>();
  let latestRouteKey: string | null = null;

  const registerScrollToTop = (routeKey: string, action: ScrollToTopAction) => {
    actions.set(routeKey, action);
    latestRouteKey = routeKey;

    return () => {
      if (actions.get(routeKey) === action) {
        actions.delete(routeKey);
      }
    };
  };

  const scrollToTop = (routeKey: string) => {
    const action = actions.get(routeKey) ?? (latestRouteKey ? actions.get(latestRouteKey) : undefined);

    if (!action) {
      return fallbackScrollToTop();
    }

    action();
    fallbackScrollToTop();
    return true;
  };

  const requestScrollToTop = (routeKey: string) => {
    pendingRouteKeys.add(routeKey);
  };

  const consumeScrollToTopRequest = (routeKey: string) => {
    if (!pendingRouteKeys.has(routeKey)) {
      return false;
    }

    const didScroll = scrollToTop(routeKey);
    if (didScroll) {
      pendingRouteKeys.delete(routeKey);
    }

    return didScroll;
  };

  return {
    registerScrollToTop,
    scrollToTop,
    requestScrollToTop,
    consumeScrollToTopRequest
  };
}
