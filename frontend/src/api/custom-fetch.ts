const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const TOKEN_STORAGE_KEY = 'pos.auth.token';

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null): void => {
  try {
    if (token === null) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // Storage unavailable (private mode, SSR): silently ignore.
  }
};

const normalizeUrl = (url: string): string => {
  // Prevent duplicate `/api/v1` segments when the base URL already includes it
  // but the generated OpenAPI path also includes the controller prefix.
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  const baseWithVersion = /\/api\/v\d+$/i.test(base) ? base : `${base}/api/v1`;
  const trimmedPath = baseWithVersion.endsWith('/api/v1') && path.startsWith('/api/v1')
    ? path.replace(/^\/api\/v\d+/, '')
    : path;
  return `${baseWithVersion}${trimmedPath}`;
};

export const customFetch = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getStoredToken();

  const response = await fetch(normalizeUrl(url), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const problem = await response.json().catch(() => ({
      title: 'Error desconocido',
      status: response.status,
    }));
    throw problem;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
    return (await response.blob()) as T;
  }

  return (await response.json()) as T;
};
