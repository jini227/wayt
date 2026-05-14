import {
  shouldDismissPickerDrag,
  shouldStartPickerDismissDrag
} from "./pickerDismissGesture";

function assertEqual(actual: boolean, expected: boolean, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(
  shouldStartPickerDismissDrag({ dx: 4, dy: 18 }),
  true,
  "downward vertical drag starts sheet-dismiss gesture"
);

assertEqual(
  shouldStartPickerDismissDrag({ dx: 28, dy: 18 }),
  false,
  "mostly horizontal drag does not start sheet-dismiss gesture"
);

assertEqual(
  shouldDismissPickerDrag({ dx: 8, dy: 82, vy: 0.2 }),
  true,
  "long downward drag dismisses picker"
);

assertEqual(
  shouldDismissPickerDrag({ dx: 6, dy: 26, vy: 1.1 }),
  true,
  "quick downward flick dismisses picker"
);

assertEqual(
  shouldDismissPickerDrag({ dx: 5, dy: 34, vy: 0.2 }),
  false,
  "short slow downward drag keeps picker open"
);

assertEqual(
  shouldDismissPickerDrag({ dx: 72, dy: 82, vy: 1.2 }),
  false,
  "diagonal or horizontal drag keeps picker open"
);

assertEqual(
  shouldDismissPickerDrag({ dx: 2, dy: -96, vy: -0.9 }),
  false,
  "upward drag keeps picker open"
);
