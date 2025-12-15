import { useAuthStore } from '../stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<{ token: string; user: { id: string; email: string; name: string } }>>(
      '/auth/login',
      { email, password }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed');
    }
    return response.data;
  },
  logout: () => api.post('/auth/logout'),
  me: async () => {
    const response = await api.get<ApiResponse<{ id: string; email: string; name: string }>>('/auth/me');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get user');
    }
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const response = await api.get<ApiResponse<{
      total: number;
      draft: number;
      inReview: number;
      approved: number;
      deployed: number;
      deprecated: number;
      totalApplications: number;
      totalBusinessUnits: number;
    }>>('/dashboard/stats');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get stats');
    }
    const d = response.data;
    return {
      totalTemplates: d.total,
      activeTemplates: d.deployed,
      totalApplications: d.totalApplications,
      totalBusinessUnits: d.totalBusinessUnits,
      templatesByStatus: [
        { status: 'DRAFT', count: d.draft },
        { status: 'IN_REVIEW', count: d.inReview },
        { status: 'APPROVED', count: d.approved },
        { status: 'DEPLOYED', count: d.deployed },
        { status: 'DEPRECATED', count: d.deprecated },
      ].filter(s => s.count > 0),
      templatesByEnvironment: [], // Fetched separately if needed
    };
  },
  getRecentActivity: async () => {
    const response = await api.get<ApiResponse<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      details: unknown;
      createdAt: string;
      user: { name: string } | null;
    }[]>>('/dashboard/recent-activity');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get recent activity');
    }
    return response.data;
  },
};

// Templates API
export const templatesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    environment?: string;
    businessUnitId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.environment) searchParams.set('environment', params.environment);
    if (params?.businessUnitId) searchParams.set('businessUnitId', params.businessUnitId);
    const query = searchParams.toString();
    return api.get<{
      data: unknown[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/templates${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get<unknown>(`/templates/${id}`),
  create: (data: unknown) => api.post<unknown>('/templates', data),
  update: (id: string, data: unknown) => api.put<unknown>(`/templates/${id}`, data),
  delete: (id: string) => api.delete<void>(`/templates/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch<unknown>(`/templates/${id}/status`, { status }),
  duplicate: (id: string) => api.post<unknown>(`/templates/${id}/duplicate`),
  addApplication: (templateId: string, data: unknown) =>
    api.post<unknown>(`/templates/${templateId}/applications`, data),
  removeApplication: (templateId: string, applicationId: string) =>
    api.delete<void>(`/templates/${templateId}/applications/${applicationId}`),
  reorderApplications: (templateId: string, applicationIds: string[]) =>
    api.patch<void>(`/templates/${templateId}/applications/reorder`, { applicationIds }),
};

// Applications API
export const applicationsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    const query = searchParams.toString();
    return api.get<{
      data: unknown[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/applications${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get<unknown>(`/applications/${id}`),
  create: (data: unknown) => api.post<unknown>('/applications', data),
  update: (id: string, data: unknown) => api.put<unknown>(`/applications/${id}`, data),
  delete: (id: string) => api.delete<void>(`/applications/${id}`),
};

// Business Units API
export const businessUnitsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; isVendor?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isVendor !== undefined) searchParams.set('isVendor', params.isVendor.toString());
    const query = searchParams.toString();
    return api.get<{
      data: unknown[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/business-units${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get<unknown>(`/business-units/${id}`),
  create: (data: unknown) => api.post<unknown>('/business-units', data),
  update: (id: string, data: unknown) => api.put<unknown>(`/business-units/${id}`, data),
  delete: (id: string) => api.delete<void>(`/business-units/${id}`),
};

// Contacts API
export const contactsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; businessUnitId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.businessUnitId) searchParams.set('businessUnitId', params.businessUnitId);
    const query = searchParams.toString();
    return api.get<{
      data: unknown[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/contacts${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get<unknown>(`/contacts/${id}`),
  create: (data: unknown) => api.post<unknown>('/contacts', data),
  update: (id: string, data: unknown) => api.put<unknown>(`/contacts/${id}`, data),
  delete: (id: string) => api.delete<void>(`/contacts/${id}`),
};

// Audit API
export const auditApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.entityType) searchParams.set('entityType', params.entityType);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    const query = searchParams.toString();
    return api.get<{
      data: unknown[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/audit${query ? `?${query}` : ''}`);
  },
};

// Export API
export const exportApi = {
  templatesCSV: () => api.get<Blob>('/export/templates/csv'),
  templatesJSON: () => api.get<unknown[]>('/export/templates/json'),
};
