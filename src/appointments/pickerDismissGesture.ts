import {
  shouldCompleteDownwardDismissDrag,
  shouldStartDownwardDismissDrag
} from "../gestures/dismissDragGesture";

export const shouldStartPickerDismissDrag = shouldStartDownwardDismissDrag;
export const shouldDismissPickerDrag = shouldCompleteDownwardDismissDrag;
