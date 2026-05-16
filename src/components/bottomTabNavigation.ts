export type BottomTabActiveContext = {
  sourceTabHref?: string | null;
};

export function isBottomTabActive(pathname: string, href: string, context: BottomTabActiveContext = {}) {
  if (pathname === href) {
    return true;
  }

  const nestedAppointmentTabHref = getNestedAppointmentTabHref(pathname, context);
  if (nestedAppointmentTabHref) {
    return href === nestedAppointmentTabHref;
  }

  const section = href.split("/")[1];
  const sectionHref = section ? `/${section}` : href;

  return pathname.startsWith(sectionHref);
}

function getNestedAppointmentTabHref(pathname: string, context: BottomTabActiveContext) {
  if (!pathname.startsWith("/appointments/") || pathname === "/appointments/next") {
    return null;
  }

  return context.sourceTabHref === "/appointments/next" ? "/appointments/next" : "/";
}

export function getBottomTabNavigationTarget(pathname: string, href: string) {
  return pathname === href ? null : href;
}

export type BottomTabPressAction =
  | { type: "scrollToTop" }
  | { type: "navigate"; target: string; scrollRoute: string; historyAction: "replace" };

export function getBottomTabPressAction(pathname: string, href: string): BottomTabPressAction {
  const target = getBottomTabNavigationTarget(pathname, href);

  return target ? { type: "navigate", target, scrollRoute: target, historyAction: "replace" } : { type: "scrollToTop" };
}
