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

// Paginated response from API
interface PaginatedApiResponse<T> {
  success: boolean;
  data?: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
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
      entityType: string | null;
      entityId: string | null;
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
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    environment?: string;
    businessUnitId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('pageSize', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.environment) searchParams.set('environment', params.environment);
    if (params?.businessUnitId) searchParams.set('businessUnitId', params.businessUnitId);
    const query = searchParams.toString();
    const response = await api.get<PaginatedApiResponse<unknown>>(`/templates${query ? `?${query}` : ''}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get templates');
    }
    return {
      data: response.data.items,
      pagination: {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.pageSize,
        totalPages: response.data.totalPages,
      },
    };
  },
  get: async (id: string) => {
    const response = await api.get<ApiResponse<unknown>>(`/templates/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get template');
    }
    return response.data;
  },
  create: async (data: unknown) => {
    const response = await api.post<ApiResponse<unknown>>('/templates', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create template');
    }
    return response.data;
  },
  update: async (id: string, data: unknown) => {
    const response = await api.put<ApiResponse<unknown>>(`/templates/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update template');
    }
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/templates/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete template');
    }
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch<ApiResponse<unknown>>(`/templates/${id}/status`, { status });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update status');
    }
    return response.data;
  },
  duplicate: async (id: string) => {
    const response = await api.post<ApiResponse<{ id: string }>>(`/templates/${id}/duplicate`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to duplicate template');
    }
    return response.data;
  },
  addApplication: async (templateId: string, data: unknown) => {
    const response = await api.post<ApiResponse<unknown>>(`/templates/${templateId}/applications`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to add application');
    }
    return response.data;
  },
  removeApplication: async (templateId: string, applicationId: string) => {
    const response = await api.delete<ApiResponse<void>>(`/templates/${templateId}/applications/${applicationId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove application');
    }
  },
  reorderApplications: async (templateId: string, applicationIds: string[]) => {
    const response = await api.patch<ApiResponse<void>>(`/templates/${templateId}/applications/reorder`, { applicationIds });
    if (!response.success) {
      throw new Error(response.error || 'Failed to reorder applications');
    }
  },
  getHistory: async (templateId: string) => {
    const response = await api.get<ApiResponse<{
      id: string;
      templateId: string;
      action: string;
      oldStatus: string | null;
      newStatus: string | null;
      changes: Record<string, unknown> | null;
      comment: string | null;
      userId: string;
      userName: string | null;
      createdAt: string;
    }[]>>(`/templates/${templateId}/history`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get template history');
    }
    return response.data;
  },
};

// Applications API
export const applicationsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('pageSize', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    const query = searchParams.toString();
    const response = await api.get<PaginatedApiResponse<unknown>>(`/applications${query ? `?${query}` : ''}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get applications');
    }
    return {
      data: response.data.items,
      pagination: {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.pageSize,
        totalPages: response.data.totalPages,
      },
    };
  },
  get: async (id: string) => {
    const response = await api.get<ApiResponse<unknown>>(`/applications/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get application');
    }
    return response.data;
  },
  create: async (data: unknown) => {
    const response = await api.post<ApiResponse<unknown>>('/applications', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create application');
    }
    return response.data;
  },
  update: async (id: string, data: unknown) => {
    const response = await api.put<ApiResponse<unknown>>(`/applications/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update application');
    }
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/applications/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete application');
    }
  },
};

// Business Units API
export const businessUnitsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; isVendor?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('pageSize', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isVendor !== undefined) searchParams.set('isVendor', params.isVendor.toString());
    const query = searchParams.toString();
    const response = await api.get<PaginatedApiResponse<unknown>>(`/business-units${query ? `?${query}` : ''}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get business units');
    }
    return {
      data: response.data.items,
      pagination: {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.pageSize,
        totalPages: response.data.totalPages,
      },
    };
  },
  get: async (id: string) => {
    const response = await api.get<ApiResponse<unknown>>(`/business-units/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get business unit');
    }
    return response.data;
  },
  create: async (data: unknown) => {
    const response = await api.post<ApiResponse<unknown>>('/business-units', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create business unit');
    }
    return response.data;
  },
  update: async (id: string, data: unknown) => {
    const response = await api.put<ApiResponse<unknown>>(`/business-units/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update business unit');
    }
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/business-units/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete business unit');
    }
  },
};

// Contacts API
export const contactsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; businessUnitId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('pageSize', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.businessUnitId) searchParams.set('businessUnitId', params.businessUnitId);
    const query = searchParams.toString();
    const response = await api.get<PaginatedApiResponse<unknown>>(`/contacts${query ? `?${query}` : ''}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get contacts');
    }
    return {
      data: response.data.items,
      pagination: {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.pageSize,
        totalPages: response.data.totalPages,
      },
    };
  },
  get: async (id: string) => {
    const response = await api.get<ApiResponse<unknown>>(`/contacts/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get contact');
    }
    return response.data;
  },
  create: async (data: unknown) => {
    const response = await api.post<ApiResponse<unknown>>('/contacts', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create contact');
    }
    return response.data;
  },
  update: async (id: string, data: unknown) => {
    const response = await api.put<ApiResponse<unknown>>(`/contacts/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update contact');
    }
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/contacts/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete contact');
    }
  },
};

// Audit API
export const auditApi = {
  list: async (params?: {
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
    if (params?.limit) searchParams.set('pageSize', params.limit.toString());
    if (params?.entityType) searchParams.set('entityType', params.entityType);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    const query = searchParams.toString();
    const response = await api.get<PaginatedApiResponse<unknown>>(`/audit/logs${query ? `?${query}` : ''}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get audit logs');
    }
    return {
      data: response.data.items,
      pagination: {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.pageSize,
        totalPages: response.data.totalPages,
      },
    };
  },
};

// Export API
export const exportApi = {
  templatesCSV: () => api.get<Blob>('/export/templates/csv'),
  templatesJSON: () => api.get<unknown[]>('/export/templates/json'),
};

// Base Images API
export const baseImagesApi = {
  list: async () => {
    const response = await api.get<ApiResponse<{
      id: string;
      name: string;
      displayName: string;
      description: string | null;
      osType: string;
      version: string;
      patchLevel: string | null;
      isActive: boolean;
    }[]>>('/base-images');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get base images');
    }
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get<ApiResponse<unknown>>(`/base-images/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get base image');
    }
    return response.data;
  },
};
