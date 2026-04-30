import { createScrollToTopStore } from "./scrollToTopStore";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

let scrollCount = 0;
const store = createScrollToTopStore();

store.requestScrollToTop("/history");
assertEqual(
  store.consumeScrollToTopRequest("/history"),
  false,
  "pending scroll request waits until the target route registers"
);

const unregister = store.registerScrollToTop("/history", () => {
  scrollCount += 1;
});

assertEqual(
  store.consumeScrollToTopRequest("/history"),
  true,
  "pending scroll request runs after the target route registers"
);
assertEqual(scrollCount, 1, "registered target route scroll action runs once");
assertEqual(
  store.consumeScrollToTopRequest("/history"),
  false,
  "pending scroll request is cleared after it runs"
);

unregister();
assertEqual(store.scrollToTop("/history"), false, "unregistered routes do not report a handled scroll");
