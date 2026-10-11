// Centralized API Service for CityCare CDO Admin Portal & Backend Integration
// Base URL: http://localhost:5000 or configured via VITE_API_URL

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getTokenPayload = (token) => {
  try {
    const segments = token.split('.');
    if (segments.length !== 3 || segments.some((segment) => !segment)) return null;
    const encodedPayload = segments[1];

    const base64 = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

// Helper to retrieve token from localStorage with validation
export const getAuthToken = () => {
  const token = localStorage.getItem('citycare_admin_token') || '';
  if (!token) return '';

  const payload = getTokenPayload(token);
  if (!payload || !Number.isFinite(payload.exp) || Date.now() >= payload.exp * 1000) {
    clearAuthSession();
    return '';
  }

  return token;
};

// Helper to validate token without clearing session (for silent checks)
export const isTokenValid = () => {
  const token = localStorage.getItem('citycare_admin_token') || '';
  
  if (!token) return false;
  
  const payload = getTokenPayload(token);
  return Boolean(payload && Number.isFinite(payload.exp) && Date.now() < payload.exp * 1000);
};

export const getAuthTokenExpiration = () => {
  const token = getAuthToken();
  if (!token) return null;

  const payload = getTokenPayload(token);
  return payload ? payload.exp * 1000 : null;
};

// Helper to set session with expiration check
export const setAuthSession = (token, refreshToken = null) => {
  localStorage.removeItem('citycare_admin_user');
  localStorage.removeItem('user');
  if (token) {
    localStorage.setItem('citycare_admin_token', token);
    
    // Calculate expiration time from token
    const payload = getTokenPayload(token);
    if (!payload || !Number.isFinite(payload.exp)) {
      clearAuthSession();
      return;
    }

  }
  
  if (refreshToken) {
    localStorage.setItem('citycare_refresh_token', refreshToken);
  }
};

// Helper to clear session
export const clearAuthSession = () => {
  localStorage.removeItem('citycare_admin_token');
  localStorage.removeItem('citycare_admin_user');
  localStorage.removeItem('user');
  localStorage.removeItem('citycare_refresh_token');
  localStorage.removeItem('citycare_session_expires');
};

// Input sanitization helper
function sanitizeInput(input) {
  if (input === null || input === undefined) return input;
  
  if (typeof input === 'string') {
    // Remove potential XSS and injection patterns
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  
  if (typeof input === 'object') {
    if (Array.isArray(input)) {
      return input.map(sanitizeInput);
    }
    
    const result = {};
    for (const key in input) {
      result[key] = sanitizeInput(input[key]);
    }
    return result;
  }
  
  return input;
}

// Generic fetch wrapper with headers and error handling
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // Sanitize request body
  let config = {
    ...options,
    headers
  };
  
  if (config.body && typeof config.body === 'object') {
    config = {
      ...config,
      body: JSON.stringify(sanitizeInput(JSON.parse(config.body)))
    };
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    const isAuthenticationRequest = /^\/auth\/(login|admin-login|register|register-resident)$/.test(endpoint);

    // A rejected login is a credential error, not an expired authenticated session.
    if (response.status === 401 && !isAuthenticationRequest) {
      clearAuthSession();
      window.location.href = '/login';
      return null;
    }

    if (!response.ok) {
      const errorMsg = (data && data.message) || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error.message);
    
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('Network error - please check your connection');
    }
    
    throw error;
  }
}

// ==========================================
// AUTHENTICATION APIs
// ==========================================
export const authApi = {
  // POST /api/auth/login
  login: async (credentials) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res.token) {
      setAuthSession(res.token);
    }
    return res;
  },

  // POST /api/auth/admin-login
  adminLogin: async (credentials) => {
    const res = await request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res.token) {
      setAuthSession(res.token);
    }
    return res;
  },

  // GET /api/auth/profile
  getProfile: async () => {
    return await request('/auth/profile');
  },

  // PUT /api/auth/profile
  updateProfile: async (profileData) => {
    return await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  getSettings: async () => {
    return await request('/auth/settings');
  },

  updateSettings: async (settings) => {
    return await request('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  resetSettings: async () => {
    return await request('/auth/settings/reset', { method: 'POST' });
  },

  logout: () => {
    clearAuthSession();
  }
};

// ==========================================
// INCIDENT / REPORTS (TICKETS) APIs
// ==========================================
export const reportsApi = {
  // GET /api/reports?status=PENDING&barangay=Carmen
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.barangay) params.append('barangay', filters.barangay);
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.district) params.append('district', filters.district);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request(`/reports${queryStr}`);
    
    // Handle both response formats: {data: [...]} or [...]
    if (res && res.data) {
      return res;
    }
    // If response is direct array, wrap it
    if (Array.isArray(res)) {
      return { success: true, count: res.length, data: res };
    }
    return res;
  },

  // GET /api/reports/:id
  getById: async (id) => {
    return await request(`/reports/${encodeURIComponent(id)}`);
  },

  // PUT /api/reports/:reportId/status
  updateStatus: async (reportId, statusData) => {
    // reportId can be either _id or reportId (e.g., #CDO-2026-0412)
    const res = await request(`/reports/${encodeURIComponent(reportId)}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    });
    
    // Handle response format
    if (res && res.data) {
      return res;
    }
    return { success: true, message: 'Report status updated', data: res };
  },

  // POST /api/reports (for creating new reports)
  create: async (reportData) => {
    return await request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  },

  // DELETE /api/reports/:id
  delete: async (id) => {
    return await request(`/reports/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }

};

// ==========================================
// DASHBOARD & ANALYTICS APIs
// ==========================================
export const dashboardApi = {
  getStats: async () => {
    return await request('/dashboard/stats');
  }
};

// ==========================================
// BARANGAYS APIs
// ==========================================
export const barangayApi = {
  getAll: async () => {
    return await request('/barangays');
  },

  create: async (data) => {
    return await request('/barangays', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  update: async (id, data) => {
    return await request(`/barangays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete: async (id) => {
    return await request(`/barangays/${id}`, {
      method: 'DELETE'
    });
  }
};

// ==========================================
// FLEET MANAGEMENT APIs
// ==========================================
export const fleetApi = {
  getAll: async () => {
    return await request('/fleet');
  },

  create: async (truckData) => {
    return await request('/fleet', {
      method: 'POST',
      body: JSON.stringify(truckData)
    });
  },

  update: async (id, truckData) => {
    return await request(`/fleet/${id}`, {
      method: 'PUT',
      body: JSON.stringify(truckData)
    });
  },

  delete: async (id) => {
    return await request(`/fleet/${id}`, {
      method: 'DELETE'
    });
  }
};

// ==========================================
// SCHEDULES APIs
// ==========================================
export const scheduleApi = {
  getAll: async (barangay = '') => {
    const query = barangay ? `?barangay=${encodeURIComponent(barangay)}` : '';
    return await request(`/schedules${query}`);
  },

  create: async (data) => {
    return await request('/schedules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  update: async (id, data) => {
    return await request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete: async (id) => {
    return await request(`/schedules/${id}`, {
      method: 'DELETE'
    });
  }
};
