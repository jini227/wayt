export function createAppointmentShareUrl({
  appointmentId,
  currentHref
}: {
  appointmentId: string;
  currentHref?: string;
}) {
  const encodedId = encodeURIComponent(appointmentId);
  const currentOrigin = originFromUrl(currentHref);
  if (currentOrigin) {
    return `${currentOrigin}${webBasePathFromUrl(currentHref)}/appointments/${encodedId}`;
  }

  return `/appointments/${encodedId}`;
}

function originFromUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function webBasePathFromUrl(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    const path = new URL(value).pathname;
    return path === "/wayt" || path.startsWith("/wayt/") ? "/wayt" : "";
  } catch {
    return "";
  }
}
