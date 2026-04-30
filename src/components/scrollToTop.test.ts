import { scrollVisibleContentToTop } from "./scrollToTop";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const scrollCalls: Array<{ y: number; animated: boolean }> = [];
const frameCallbacks: Array<(timestamp: number) => void> = [];
const didScroll = scrollVisibleContentToTop({
  currentY: 120,
  scrollable: {
    scrollTo: (options) => scrollCalls.push(options)
  },
  browserTarget: {
    requestAnimationFrame: (callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    }
  }
});

assertEqual(didScroll, true, "scrolling reports work when a visible target exists");
frameCallbacks.shift()?.(0);
frameCallbacks.shift()?.(155);
frameCallbacks.shift()?.(310);
frameCallbacks.shift()?.(465);
frameCallbacks.shift()?.(620);

assertEqual(scrollCalls.length >= 4, true, "registered ScrollView receives smooth frame-by-frame scroll requests");
assertEqual(scrollCalls[0]?.y, 120, "smooth scroll starts from the tracked scroll position");
assertEqual(scrollCalls[1]!.y > scrollCalls[2]!.y, true, "smooth scroll moves upward over time");
assertEqual(scrollCalls[scrollCalls.length - 1]?.y, 0, "smooth scroll ends at y=0");
assertEqual(scrollCalls.every((call) => call.animated === false), true, "manual smooth scroll disables native animation per frame");

const documentElement = {
  scrollTop: 240,
  scrollLeft: 30
};
const body = {
  scrollTop: 180,
  scrollLeft: 20
};

scrollVisibleContentToTop({
  browserTarget: {
    document: {
      documentElement,
      body
    }
  }
});

assertEqual(documentElement.scrollTop, 0, "documentElement scroll position resets to top");
assertEqual(documentElement.scrollLeft, 0, "documentElement horizontal scroll position resets");
assertEqual(body.scrollTop, 0, "body scroll position resets to top");
assertEqual(body.scrollLeft, 0, "body horizontal scroll position resets");
