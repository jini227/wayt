export function isBottomTabActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  const section = href.split("/")[1];
  const sectionHref = section ? `/${section}` : href;

  return pathname === href || pathname.startsWith(sectionHref);
}

export function getBottomTabNavigationTarget(pathname: string, href: string) {
  return isBottomTabActive(pathname, href) ? null : href;
}

export type BottomTabPressAction =
  | { type: "scrollToTop" }
  | { type: "navigate"; target: string; scrollRoute: string; historyAction: "replace" };

export function getBottomTabPressAction(pathname: string, href: string): BottomTabPressAction {
  const target = getBottomTabNavigationTarget(pathname, href);

  return target ? { type: "navigate", target, scrollRoute: target, historyAction: "replace" } : { type: "scrollToTop" };
}
