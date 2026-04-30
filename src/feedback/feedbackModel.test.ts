import {
  getFeedbackPresentation,
  normalizeFeedbackActions
} from "./feedbackModel";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const defaultActions = normalizeFeedbackActions();

assertEqual(defaultActions.length, 1, "missing actions get a single default button");
assertEqual(defaultActions[0]?.label, "확인", "default button uses a concise Korean label");
assertEqual(defaultActions[0]?.role, "primary", "default button is the primary action");

const trimmedActions = normalizeFeedbackActions([
  { label: "취소", role: "cancel" },
  { label: "지우기", role: "destructive" },
  { label: "나중에", role: "secondary" }
]);

assertEqual(trimmedActions.length, 2, "dialogs keep at most two visible actions");
assertEqual(trimmedActions[1]?.role, "destructive", "destructive confirmation remains visible");

const blankAction = normalizeFeedbackActions([{ label: "  ", role: "secondary" }]);

assertEqual(blankAction[0]?.label, "확인", "blank action labels fall back safely");
assertEqual(blankAction[0]?.role, "secondary", "explicit action role is preserved");

const successPresentation = getFeedbackPresentation("success");
const dangerPresentation = getFeedbackPresentation("danger");

assertEqual(successPresentation.icon, "check", "success feedback uses a check icon");
assertEqual(successPresentation.accentColor, "#19C36B", "success feedback uses the app success color");
assertEqual(dangerPresentation.icon, "alert", "danger feedback uses an alert icon");
assertEqual(dangerPresentation.accentColor, "#FF3B30", "danger feedback uses the app danger color");
