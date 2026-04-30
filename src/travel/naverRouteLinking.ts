export type NaverRouteOpenResult = "route" | "store";

export type NaverRouteLinking = {
  openURL: (url: string) => Promise<unknown>;
  canOpenURL?: (url: string) => Promise<boolean>;
};

export async function openNaverRouteUrl({
  routeUrl,
  storeUrl,
  linking
}: {
  routeUrl: string;
  storeUrl: string;
  linking: NaverRouteLinking;
}): Promise<NaverRouteOpenResult> {
  try {
    await linking.openURL(routeUrl);
    return "route";
  } catch {
    await linking.openURL(storeUrl);
    return "store";
  }
}
