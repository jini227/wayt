import { colors } from "../theme";

export type FeedbackTone = "info" | "success" | "warning" | "danger";
export type FeedbackIconKey = "info" | "check" | "alert";
export type FeedbackActionRole = "primary" | "secondary" | "cancel" | "destructive";

export type FeedbackAction = {
  label: string;
  role?: FeedbackActionRole;
  onPress?: () => void;
};

export type FeedbackPresentation = {
  icon: FeedbackIconKey;
  accentColor: string;
  softColor: string;
};

const PRESENTATION: Record<FeedbackTone, FeedbackPresentation> = {
  info: {
    icon: "info",
    accentColor: colors.primary,
    softColor: colors.primarySoft
  },
  success: {
    icon: "check",
    accentColor: colors.success,
    softColor: colors.successSoft
  },
  warning: {
    icon: "alert",
    accentColor: "#F59E0B",
    softColor: "#FFF7E6"
  },
  danger: {
    icon: "alert",
    accentColor: colors.danger,
    softColor: colors.dangerSoft
  }
};

export function getFeedbackPresentation(tone: FeedbackTone = "info") {
  return PRESENTATION[tone];
}

export function normalizeFeedbackActions(actions?: FeedbackAction[]) {
  const normalized = (actions && actions.length > 0 ? actions : [{ label: "확인", role: "primary" as const }])
    .slice(0, 2)
    .map((action) => ({
      ...action,
      label: action.label.trim() || "확인",
      role: action.role ?? "primary" as const
    }));

  return normalized;
}
