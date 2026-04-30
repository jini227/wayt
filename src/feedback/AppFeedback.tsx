import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react-native";
import { colors, spacing } from "../theme";
import {
  getFeedbackPresentation,
  normalizeFeedbackActions,
  type FeedbackAction,
  type FeedbackIconKey,
  type FeedbackTone
} from "./feedbackModel";

type ToastRequest = {
  title: string;
  message?: string;
  tone?: FeedbackTone;
  durationMs?: number;
};

type DialogRequest = {
  title: string;
  message?: string;
  tone?: FeedbackTone;
  actions?: FeedbackAction[];
};

type ToastState = Required<Pick<ToastRequest, "title" | "tone" | "durationMs">> & {
  id: number;
  message?: string;
};

type DialogState = Required<Pick<DialogRequest, "title" | "tone">> & {
  message?: string;
  actions: FeedbackAction[];
};

type AppFeedbackApi = {
  showToast: (request: ToastRequest) => void;
  showDialog: (request: DialogRequest) => void;
  dismissDialog: () => void;
};

const AppFeedbackContext = createContext<AppFeedbackApi | null>(null);

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const showToast = useCallback((request: ToastRequest) => {
    setToast({
      id: Date.now(),
      title: request.title,
      message: request.message,
      tone: request.tone ?? "success",
      durationMs: request.durationMs ?? 2200
    });
  }, []);

  const showDialog = useCallback((request: DialogRequest) => {
    setDialog({
      title: request.title,
      message: request.message,
      tone: request.tone ?? "info",
      actions: normalizeFeedbackActions(request.actions)
    });
  }, []);

  const dismissDialog = useCallback(() => {
    setDialog(null);
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setToast((current) => current?.id === toast.id ? null : current);
    }, toast.durationMs);

    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({ showToast, showDialog, dismissDialog }),
    [dismissDialog, showDialog, showToast]
  );

  return (
    <AppFeedbackContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {toast ? <FeedbackToast toast={toast} bottom={Math.max(insets.bottom + 92, 92)} /> : null}
      </View>
      <FeedbackDialog dialog={dialog} onDismiss={dismissDialog} />
    </AppFeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const context = useContext(AppFeedbackContext);
  if (!context) {
    throw new Error("useAppFeedback must be used inside AppFeedbackProvider");
  }
  return context;
}

function FeedbackToast({ toast, bottom }: { toast: ToastState; bottom: number }) {
  const presentation = getFeedbackPresentation(toast.tone);

  return (
    <View pointerEvents="none" style={[styles.toast, { bottom }]}>
      <View style={[styles.toastIcon, { backgroundColor: presentation.softColor }]}>
        <FeedbackIcon icon={presentation.icon} color={presentation.accentColor} size={20} />
      </View>
      <View style={styles.toastTextBlock}>
        <Text style={styles.toastTitle} numberOfLines={2}>{toast.title}</Text>
        {toast.message ? <Text style={styles.toastMessage} numberOfLines={2}>{toast.message}</Text> : null}
      </View>
    </View>
  );
}

function FeedbackDialog({
  dialog,
  onDismiss
}: {
  dialog: DialogState | null;
  onDismiss: () => void;
}) {
  const presentation = getFeedbackPresentation(dialog?.tone ?? "info");

  return (
    <Modal
      transparent
      visible={dialog !== null}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.dialogOverlay}>
        {dialog ? (
          <View style={styles.dialogSheet}>
            <View style={[styles.dialogIcon, { backgroundColor: presentation.softColor }]}>
              <FeedbackIcon icon={presentation.icon} color={presentation.accentColor} size={25} />
            </View>
            <Text style={styles.dialogTitle}>{dialog.title}</Text>
            {dialog.message ? <Text style={styles.dialogMessage}>{dialog.message}</Text> : null}
            <View style={styles.dialogActions}>
              {dialog.actions.map((action) => (
                <Pressable
                  key={`${action.role}-${action.label}`}
                  onPress={() => {
                    onDismiss();
                    action.onPress?.();
                  }}
                  style={({ pressed }) => [
                    styles.dialogButton,
                    action.role === "primary" && styles.primaryButton,
                    action.role === "destructive" && styles.destructiveButton,
                    (action.role === "secondary" || action.role === "cancel") && styles.secondaryButton,
                    pressed && styles.pressed
                  ]}
                >
                  <Text
                    style={[
                      styles.dialogButtonText,
                      action.role === "primary" && styles.primaryButtonText,
                      action.role === "destructive" && styles.destructiveButtonText
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function FeedbackIcon({
  icon,
  color,
  size
}: {
  icon: FeedbackIconKey;
  color: string;
  size: number;
}) {
  if (icon === "check") {
    return <CheckCircle2 color={color} size={size} strokeWidth={2.5} />;
  }
  if (icon === "alert") {
    return <AlertTriangle color={color} size={size} strokeWidth={2.4} />;
  }
  return <Info color={color} size={size} strokeWidth={2.5} />;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 18,
    right: 18,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECEFF4",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    ...spacing.softShadow
  },
  toastIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  toastTextBlock: {
    flex: 1,
    minWidth: 0
  },
  toastTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20
  },
  toastMessage: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 1
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 7, 0.34)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  dialogSheet: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: "center",
    ...spacing.shadow
  },
  dialogIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15
  },
  dialogTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
    textAlign: "center"
  },
  dialogMessage: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8
  },
  dialogActions: {
    width: "100%",
    flexDirection: "row",
    gap: 9,
    marginTop: 22
  },
  dialogButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10
  },
  primaryButton: {
    backgroundColor: colors.primary,
    ...spacing.buttonShadow
  },
  destructiveButton: {
    backgroundColor: colors.danger
  },
  secondaryButton: {
    backgroundColor: "#F5F6F8",
    borderWidth: 1,
    borderColor: "#E6E8ED"
  },
  dialogButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  primaryButtonText: {
    color: "#FFFFFF"
  },
  destructiveButtonText: {
    color: "#FFFFFF"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  }
});
