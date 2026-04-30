import { openNaverRouteUrl } from "./naverRouteLinking";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertDeepEqual<T>(actual: T, expected: T, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, got ${actualJson}`);
  }
}

const routeUrl = "nmap://route/car?dlat=37.1&dlng=127.1&appname=com.hyozk.wayt";
const storeUrl = "http://itunes.apple.com/app/id311867728?mt=8";

async function run() {
  const openedUrls: string[] = [];

  const result = await openNaverRouteUrl({
    routeUrl,
    storeUrl,
    linking: {
      canOpenURL: async () => false,
      openURL: async (url: string) => {
        openedUrls.push(url);
      }
    }
  });

  assertEqual(result, "route", "route URL opens without trusting canOpenURL preflight");
  assertDeepEqual(openedUrls, [routeUrl], "installed Naver Map route is attempted before App Store fallback");

  const fallbackOpenedUrls: string[] = [];

  const fallbackResult = await openNaverRouteUrl({
    routeUrl,
    storeUrl,
    linking: {
      openURL: async (url: string) => {
        fallbackOpenedUrls.push(url);
        if (url === routeUrl) {
          throw new Error("No app can handle route URL");
        }
      }
    }
  });

  assertEqual(fallbackResult, "store", "store opens when route URL cannot be handled");
  assertDeepEqual(fallbackOpenedUrls, [routeUrl, storeUrl], "store fallback happens only after route open fails");
}

run();
