const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// CSRF double-submit token: kept in memory, fetched on demand, refreshed once if the server rejects it.
let csrfToken = null;
let csrfInFlight = null;

async function fetchCsrfToken() {
  const res = await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
  const json = await res.json();
  csrfToken = json.data.csrfToken;
  return csrfToken;
}

function ensureCsrfToken() {
  if (csrfToken) return Promise.resolve(csrfToken);
  csrfInFlight ??= fetchCsrfToken().finally(() => {
    csrfInFlight = null;
  });
  return csrfInFlight;
}

function buildUrl(path, query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return `${BASE}${path}${qs ? `?${qs}` : ''}`;
}

const SESSION_QUIET_PATHS = new Set(['/auth/login', '/auth/register', '/auth/me']);

async function send(method, path, { body, query, signal } = {}, canRetry = true) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-CSRF-Token'] = await ensureCsrfToken();

  let res;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      credentials: 'include',
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const error = json?.error;
    if (res.status === 403 && error?.code === 'CSRF_INVALID' && canRetry) {
      csrfToken = null;
      return send(method, path, { body, query, signal }, false);
    }
    if (res.status === 401 && !SESSION_QUIET_PATHS.has(path)) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new ApiError(res.status, error?.code ?? 'ERROR', error?.message ?? 'Something went wrong', error?.details);
  }

  if (json?.data?.csrfToken) csrfToken = json.data.csrfToken; // rotated on login/register
  return json; // { success, data, meta? }
}

export const api = {
  get: (path, options) => send('GET', path, options),
  post: (path, body, options) => send('POST', path, { ...options, body: body ?? {} }),
  patch: (path, body, options) => send('PATCH', path, { ...options, body: body ?? {} }),
  delete: (path, options) => send('DELETE', path, options),
};
