// Centralized API Service for CityCare CDO Admin Portal & Backend Integration
// Base URL: http://localhost:5000 or configured via VITE_API_URL

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to retrieve token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('citycare_admin_token') || '';
};

// Helper to set session
export const setAuthSession = (token, user) => {
  if (token) localStorage.setItem('citycare_admin_token', token);
  if (user) localStorage.setItem('citycare_admin_user', JSON.stringify(user));
};

// Helper to clear session
export const clearAuthSession = () => {
  localStorage.removeItem('citycare_admin_token');
  localStorage.removeItem('citycare_admin_user');
};

// Helper to get currently logged in user info
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('citycare_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Generic fetch wrapper with headers and error handling
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

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
      setAuthSession(res.token, res.user);
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
