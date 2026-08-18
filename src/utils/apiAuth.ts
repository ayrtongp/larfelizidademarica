export function getApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function withApiAuth(
  headers: Record<string, string> = {},
): Record<string, string> {
  const token = getApiToken();
  return token ? { Authorization: `Bearer ${token}`, ...headers } : headers;
}
