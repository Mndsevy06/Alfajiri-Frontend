const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

/** Essaye de renouveler l'access token via le refresh token.
 *  Retourne le nouveau access token ou null si échec. */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access) {
      localStorage.setItem('accessToken', data.access);
      return data.access;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}, _retry = true): Promise<any> {
  const token = localStorage.getItem('accessToken');

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Inject Active Entity ID if present
  const entiteId = localStorage.getItem('activeEntiteId');
  if (entiteId) {
    headers.set('X-Entite-ID', entiteId);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (_retry) {
      // Tenter de rafraîchir le token
      const newToken = await tryRefreshToken();
      if (newToken) {
        // Réessayer la requête avec le nouveau token
        return fetchWithAuth(endpoint, options, false);
      }
    }
    // Refresh échoué ou déjà retried → déconnexion
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('activeEntiteId');
    window.location.href = '/login';
    throw new Error('Non autorisé');
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {}
    throw new Error(
      errorData.error || errorData.detail ||
      (Object.keys(errorData).length ? JSON.stringify(errorData) : 'Erreur API')
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

