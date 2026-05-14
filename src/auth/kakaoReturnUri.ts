type WebLocation = {
  origin: string;
  pathname: string;
};

export function createWebKakaoReturnUri(location: WebLocation | null) {
  if (!location?.origin) {
    return null;
  }

  return `${location.origin}${webDeploymentBasePath(location.pathname)}/auth/kakao`;
}

export function currentWebLocation(): WebLocation | null {
  if (typeof window === "undefined") {
    return null;
  }

  return {
    origin: window.location.origin,
    pathname: window.location.pathname
  };
}

export function webDeploymentBasePath(pathname: string) {
  return pathname === "/wayt" || pathname.startsWith("/wayt/") ? "/wayt" : "";
}

export function shouldUseFullPageKakaoRedirect(location: WebLocation | null) {
  if (!location?.origin) {
    return false;
  }

  return !isSecureWebAuthOrigin(location.origin);
}

function isSecureWebAuthOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol === "https:") {
      return true;
    }

    if (url.protocol !== "http:") {
      return false;
    }

    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1" || url.hostname === "[::1]";
  } catch {
    return false;
  }
}
