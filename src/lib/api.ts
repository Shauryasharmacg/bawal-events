// Frontend API helper

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isAdminEndpoint = endpoint.startsWith('/api/admin') || endpoint.startsWith('/api/tickets/checkin');
  
  // Prioritize admin token for admin routes; user token for attendee routes
  let token: string | null = null;
  if (isAdminEndpoint) {
    token = localStorage.getItem('bawal_admin_token');
  } else {
    token = localStorage.getItem('bawal_user_token') || localStorage.getItem('bawal_admin_token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && isAdminEndpoint) {
      localStorage.removeItem('bawal_admin_token');
      localStorage.removeItem('bawal_admin_user');
      window.dispatchEvent(new CustomEvent('bawal:admin-unauthorized'));
    }
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}
