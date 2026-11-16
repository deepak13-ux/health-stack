const BASE_URL = (import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const TOKEN_KEY = "careflow.api.token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

function describe(status, data) {
  const detail = Array.isArray(data?.detail)
    ? data.detail.map((e) => e.msg).join(" ")
    : typeof data?.detail === "string" ? data.detail : null;
  if (detail && !["Not Found", "Method Not Allowed"].includes(detail)) return detail;
  if (status === 404) return "That record wasn't found.";
  if (status >= 500) return `The server couldn't complete this request (${status}). Try again.`;
  return `Request failed (${status}).`;
}

export async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check that the backend is running, then retry.", 0);
  }
  const type = response.headers?.get?.("content-type") || "application/json";
  const data = response.status === 204 || !type.includes("application/json")
    ? null
    : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      clearToken();
      window.dispatchEvent(new Event("careflow:unauthorized"));
    }
    throw new ApiError(describe(response.status, data), response.status);
  }
  if (response.status !== 204 && data === null) {
    throw new ApiError("The server sent an unexpected response. Check the API URL and retry.", response.status);
  }
  return data;
}
