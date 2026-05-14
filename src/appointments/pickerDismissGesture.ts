type PickerDragGesture = {
  dx: number;
  dy: number;
  vy?: number;
};

const START_DISTANCE = 12;
const DISMISS_DISTANCE = 72;
const FAST_DISMISS_DISTANCE = 22;
const FAST_DISMISS_VELOCITY = 0.85;
const VERTICAL_DOMINANCE_RATIO = 1.2;

export function shouldStartPickerDismissDrag(gesture: PickerDragGesture) {
  return isDownwardVerticalDrag(gesture) && gesture.dy >= START_DISTANCE;
}

export function shouldDismissPickerDrag(gesture: PickerDragGesture) {
  if (!isDownwardVerticalDrag(gesture)) {
    return false;
  }

  return (
    gesture.dy >= DISMISS_DISTANCE ||
    (gesture.dy >= FAST_DISMISS_DISTANCE && (gesture.vy ?? 0) >= FAST_DISMISS_VELOCITY)
  );
}

function isDownwardVerticalDrag(gesture: PickerDragGesture) {
  return gesture.dy > 0 && gesture.dy >= Math.abs(gesture.dx) * VERTICAL_DOMINANCE_RATIO;
}
