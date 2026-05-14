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
