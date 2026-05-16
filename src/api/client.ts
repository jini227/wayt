import { env } from "../config/env";
import { getAuthItem } from "../auth/authStorage";
import { apiErrorMessage } from "./errors";

const ACCESS_TOKEN_KEY = "wayt.accessToken";

export async function apiPost<TResponse, TBody extends object>(path: string, body: TBody): Promise<TResponse> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(apiErrorMessage(message, response.status));
  }

  return response.json() as Promise<TResponse>;
}

export async function apiGetAuthenticated<TResponse>(path: string): Promise<TResponse> {
  const accessToken = await getAuthItem(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    throw new Error("Login is required");
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(apiErrorMessage(message, response.status));
  }

  return response.json() as Promise<TResponse>;
}

export async function apiGetOptionalAuthenticated<TResponse>(path: string): Promise<TResponse> {
  const accessToken = await getAuthItem(ACCESS_TOKEN_KEY);
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(apiErrorMessage(message, response.status));
  }

  return response.json() as Promise<TResponse>;
}

export async function apiPostAuthenticated<TResponse, TBody extends object>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const accessToken = await getAuthItem(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    throw new Error("Login is required");
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(apiErrorMessage(message, response.status));
  }

  return response.json() as Promise<TResponse>;
}

export async function apiPatchAuthenticated<TResponse, TBody extends object>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const accessToken = await getAuthItem(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    throw new Error("Login is required");
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(apiErrorMessage(message, response.status));
  }

  return response.json() as Promise<TResponse>;
}

export async function apiDeleteAuthenticated(path: string): Promise<void> {
  const accessToken = await getAuthItem(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    throw new Error("Login is required");
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(apiErrorMessage(message, response.status));
  }
}
