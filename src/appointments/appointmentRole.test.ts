import { appointmentRoleMark } from "./appointmentRole";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(appointmentRoleMark("HOST"), "방장", "HOST appointments show the host mark");
assertEqual(appointmentRoleMark("방장"), "방장", "Korean host labels keep the host mark");
assertEqual(appointmentRoleMark("PARTICIPANT"), null, "participant appointments do not show a role mark");
assertEqual(appointmentRoleMark("참가자"), null, "Korean participant labels do not show a role mark");
assertEqual(appointmentRoleMark(null), null, "missing roles do not show a role mark");
