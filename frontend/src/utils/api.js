const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (_) {}
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }
  return await response.json();
}

export const api = {
  // Auth API
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  // Trip API
  getTrips: () => request('/api/trips', { method: 'GET' }),
  getTripById: (id) => request(`/api/trips/${id}`, { method: 'GET' }),
  generateTrip: (body) => request('/api/trips', { method: 'POST', body: JSON.stringify(body) }),
  updateTrip: (id, body) => request(`/api/trips/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTrip: (id) => request(`/api/trips/${id}`, { method: 'DELETE' }),
  regenerateDay: (id, dayNumber, feedback) => 
    request(`/api/trips/${id}/regenerate-day`, { 
      method: 'POST', 
      body: JSON.stringify({ dayNumber, feedback }) 
    }),
};
