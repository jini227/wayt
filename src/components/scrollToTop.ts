type ScrollToOptions = {
  y: number;
  animated: boolean;
};

type Scrollable = {
  scrollTo: (options: ScrollToOptions) => void;
};

type ScrollPositionNode = {
  scrollTop: number;
  scrollLeft: number;
};

type BrowserScrollTarget = {
  window?: {
    scrollTo?: (options: { top: number; left: number; behavior: "auto" }) => void;
  };
  document?: {
    documentElement?: ScrollPositionNode | null;
    body?: ScrollPositionNode | null;
  };
  requestAnimationFrame?: (callback: (timestamp: number) => void) => number;
};

const SCROLL_TO_TOP_DURATION_MS = 620;

export function scrollVisibleContentToTop({
  currentY,
  scrollable,
  browserTarget = globalThis
}: {
  currentY?: number;
  scrollable?: Scrollable | null;
  browserTarget?: BrowserScrollTarget;
}) {
  let didScroll = false;

  if (scrollable) {
    const startY = Math.max(0, currentY ?? 0);
    animateToTop({
      startY,
      requestAnimationFrame: browserTarget.requestAnimationFrame,
      setY: (y) => scrollable.scrollTo({ y, animated: false })
    });
    didScroll = true;
  }

  return scrollBrowserViewportToTop(browserTarget) || didScroll;
}

function scrollBrowserViewportToTop(target: BrowserScrollTarget) {
  const documentElement = target.document?.documentElement;
  const body = target.document?.body;
  const startY = Math.max(documentElement?.scrollTop ?? 0, body?.scrollTop ?? 0);
  const hasViewport =
    typeof target.window?.scrollTo === "function" ||
    Boolean(documentElement) ||
    Boolean(body);

  if (!hasViewport) {
    return false;
  }

  animateToTop({
    startY,
    requestAnimationFrame: target.requestAnimationFrame,
    setY: (y) => {
      target.window?.scrollTo?.({ top: y, left: 0, behavior: "auto" });
      resetScrollPosition(documentElement, y);
      resetScrollPosition(body, y);
    }
  });

  return true;
}

function animateToTop({
  startY,
  requestAnimationFrame,
  setY
}: {
  startY: number;
  requestAnimationFrame?: BrowserScrollTarget["requestAnimationFrame"];
  setY: (y: number) => void;
}) {
  if (startY <= 1 || typeof requestAnimationFrame !== "function") {
    setY(0);
    return;
  }

  let startTime: number | null = null;

  const step = (timestamp: number) => {
    startTime ??= timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(1, elapsed / SCROLL_TO_TOP_DURATION_MS);
    const easedProgress = easeInOutCubic(progress);
    const nextY = Math.round(startY * (1 - easedProgress));

    setY(nextY);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function resetScrollPosition(node: ScrollPositionNode | null | undefined, y: number) {
  if (!node) {
    return;
  }

  node.scrollTop = y;
  node.scrollLeft = 0;
}
