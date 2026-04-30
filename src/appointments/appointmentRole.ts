export function appointmentRoleMark(role: unknown): "방장" | null {
  if (typeof role !== "string") {
    return null;
  }

  const normalized = role.trim();
  return normalized === "HOST" || normalized === "방장" ? "방장" : null;
}
