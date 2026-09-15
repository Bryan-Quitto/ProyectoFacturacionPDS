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
  let response: Response;
  try {
    response = await fetch(normalizeUrl(url), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw {
      status: 0,
      title: 'Error de conexión',
      detail: 'No se pudo establecer comunicación con el servidor. Verifique su conexión a internet.',
    };
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => ({
      title: 'Error en el servidor',
      detail: 'El servidor no pudo procesar la solicitud en este momento.',
      status: response.status,
    }));
    throw problem;
  }

  if (response.status === 204) {
    return {
      status: response.status,
      data: undefined,
      headers: response.headers,
    } as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
    const blob = await response.blob();
    return {
      status: response.status,
      data: blob,
      headers: response.headers,
    } as T;
  }

  const data = await response.json();
  return {
    status: response.status,
    data,
    headers: response.headers,
  } as T;
};
