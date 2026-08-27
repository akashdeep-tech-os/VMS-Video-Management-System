// Centralized API client for the SURAKSHIT VMS backend (Spring Boot, /api/v1).
//
// The backend wraps every response in an envelope:
//   success -> { "data": <payload>, "pagination"?: {...} }
//   error   -> { "error": { "code": "...", "message": "..." } }
// and uses snake_case field names throughout.
//
// This module hides all of that: callers get the unwrapped `data` back and a
// plain Error (with .status and .code attached) on failure. Every domain
// service (auth, users, cameras, dashboard, ...) is built on top of it.

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "vms_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(hasBody) {
  const headers = {};
  if (hasBody) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Perform a request and unwrap the backend envelope.
 *
 * @param {string} path   Path relative to /api/v1, e.g. "/cameras" or "/users/5".
 * @param {object} [opts]
 * @param {string} [opts.method]        HTTP method (default GET).
 * @param {object} [opts.body]          JSON body (object; serialized for you).
 * @param {object} [opts.params]        Query params (undefined/null are skipped).
 * @param {boolean} [opts.withMeta]     Resolve to { data, pagination } instead of just data.
 * @returns the unwrapped `data` (or { data, pagination } when withMeta).
 */
// In-flight GET de-duplication.
//
// React StrictMode (dev) mounts every component twice, so each effect-driven
// fetch fires twice — visible as duplicated calls in the network tab. The same
// thing happens whenever two components legitimately request the same resource
// on the same tick (e.g. two panels both loading /rights).
//
// A GET is idempotent, so concurrent identical ones can safely share a single
// request: the first caller performs it, later callers await the same promise.
// The entry is dropped as soon as it settles, so this is NOT a response cache —
// a refetch after a mutation still hits the network. Only GETs are pooled;
// POST/PATCH/DELETE always execute individually.
const inFlightGets = new Map();

export async function request(path, opts = {}) {
  // Only what the pooling key needs; performRequest reads the rest.
  const { method = "GET", params, withMeta = false } = opts;

  if (method === "GET") {
    const key = `${path}|${JSON.stringify(params ?? null)}|${withMeta}`;
    const pending = inFlightGets.get(key);
    if (pending) return pending;
    const promise = performRequest(path, opts).finally(() => inFlightGets.delete(key));
    inFlightGets.set(key, promise);
    return promise;
  }
  return performRequest(path, opts);
}

async function performRequest(path, opts = {}) {
  const { method = "GET", body, params, withMeta = false, headers: extraHeaders } = opts;

  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });
    const q = qs.toString();
    if (q) url += `?${q}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { ...authHeaders(body !== undefined), ...(extraHeaders || {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network / CORS / server-down failure — never returns an envelope.
    const err = new Error(
      "Cannot reach the server. Check that the backend is running.",
    );
    err.status = 0;
    err.code = "NETWORK_ERROR";
    throw err;
  }

  // Session expired / not authenticated -> force re-login.
  if (res.status === 401) {
    clearToken();
    if (window.location.pathname !== "/") window.location.href = "/";
    const err = new Error("Session expired. Please sign in again.");
    err.status = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  if (res.status === 204) return withMeta ? { data: null } : null;

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.code = payload?.error?.code || null;
    throw err;
  }

  // Success envelope: prefer `data`, but tolerate a bare body just in case.
  const data = payload && "data" in payload ? payload.data : payload;
  return withMeta ? { data, pagination: payload?.pagination ?? null } : data;
}

export const apiClient = {
  get: (path, params, withMeta) => request(path, { params, withMeta }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
  request,
};

export default apiClient;
