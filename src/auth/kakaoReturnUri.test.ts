import { createWebKakaoReturnUri, webDeploymentBasePath } from "./kakaoReturnUri";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(webDeploymentBasePath("/wayt/login"), "/wayt", "Wayt web subpath is preserved");
assertEqual(webDeploymentBasePath("/login"), "", "root web deployments stay at the origin");
assertEqual(
  createWebKakaoReturnUri({ origin: "http://52.79.233.46", pathname: "/wayt/login" }),
  "http://52.79.233.46/wayt/auth/kakao",
  "production web return URI keeps the /wayt base path"
);
assertEqual(
  createWebKakaoReturnUri({ origin: "http://localhost:8083", pathname: "/login" }),
  "http://localhost:8083/auth/kakao",
  "local web return URI can use the root path"
);
