import axios from 'axios';
import {
  User,
  WorkerProfile,
  Scheme,
  Application,
  RecommendationItem,
  EligibilityResult,
  NotificationItem,
  AdminAnalytics,
  DatasetPreviewResponse,
  IssueReport,
  IssueReportCreatePayload,
  DocumentItem,
  TrustedPortal,
  PortalScheme
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If unauthorized on protected route, redirect safely
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};

// ==================== WORKER API ====================
export const workerApi = {
  getProfile: async (): Promise<WorkerProfile> => {
    const res = await api.get('/workers/profile');
    return res.data;
  },
  updateProfile: async (data: Partial<WorkerProfile>): Promise<WorkerProfile> => {
    const res = await api.put('/workers/profile', data);
    return res.data;
  },
  getDashboard: async () => {
    const res = await api.get('/workers/dashboard');
    return res.data;
  }
};

// ==================== SCHEMES API ====================
export const schemeApi = {
  getSchemes: async (params?: { category?: string; state?: string; occupation?: string; search?: string; status_filter?: string }): Promise<Scheme[]> => {
    const res = await api.get('/schemes', { params });
    return res.data;
  },
  getCategories: async (): Promise<string[]> => {
    const res = await api.get('/schemes/categories');
    return res.data;
  },
  getScheme: async (schemeId: string): Promise<Scheme> => {
    const res = await api.get(`/schemes/${schemeId}`);
    return res.data;
  },
  createScheme: async (data: Partial<Scheme>): Promise<Scheme> => {
    const res = await api.post('/schemes', data);
    return res.data;
  },
  updateScheme: async (schemeId: string, data: Partial<Scheme>): Promise<Scheme> => {
    const res = await api.put(`/schemes/${schemeId}`, data);
    return res.data;
  },
  toggleStatus: async (schemeId: string): Promise<Scheme> => {
    const res = await api.patch(`/schemes/${schemeId}/toggle-status`);
    return res.data;
  },
  deleteScheme: async (schemeId: string) => {
    const res = await api.delete(`/schemes/${schemeId}`);
    return res.data;
  }
};

// ==================== DATASET UPLOAD API ====================
export const datasetApi = {
  uploadPreview: async (file: File): Promise<DatasetPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/dataset/upload-preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  confirmImport: async (import_token: string, overwrite_existing: boolean = true) => {
    const res = await api.post('/dataset/confirm-import', { import_token, overwrite_existing });
    return res.data;
  },
  getTemplateDownloadUrl: () => `${API_BASE_URL}/dataset/template-csv`
};

// ==================== RECOMMENDATION API ====================
export const recommendationApi = {
  getMyRecommendations: async (): Promise<{
    worker_name: string;
    total_schemes_evaluated: number;
    recommendations: RecommendationItem[];
    profile_completion: number;
  }> => {
    const res = await api.get('/recommendations');
    return res.data;
  },
  getWorkerRecommendations: async (workerId: number) => {
    const res = await api.get(`/recommendations/worker/${workerId}`);
    return res.data;
  },
  getMLModelMetadata: async () => {
    const res = await api.get('/recommendations/ml-model-metadata');
    return res.data;
  }
};

// ==================== ELIGIBILITY API ====================
export const eligibilityApi = {
  checkEligibility: async (schemeId: string): Promise<EligibilityResult> => {
    const res = await api.post('/eligibility/check', { scheme_id: schemeId });
    return res.data;
  }
};

// ==================== APPLICATIONS & TRACKING API ====================
export const applicationApi = {
  apply: async (scheme_id: string, remarks?: string): Promise<Application> => {
    const res = await api.post('/applications', { scheme_id, remarks });
    return res.data;
  },
  getMyApplications: async (): Promise<Application[]> => {
    const res = await api.get('/applications/my');
    return res.data;
  },
  getAllApplications: async (params?: { status_filter?: string; scheme_id?: string; search?: string }): Promise<Application[]> => {
    const res = await api.get('/applications', { params });
    return res.data;
  },
  getApplication: async (id: number): Promise<Application> => {
    const res = await api.get(`/applications/${id}`);
    return res.data;
  },
  trackByNumber: async (applicationNo: string): Promise<Application> => {
    const res = await api.get(`/applications/track/${applicationNo}`);
    return res.data;
  },
  updateStatus: async (id: number, new_status: string, remarks?: string, benefit_amount?: number): Promise<Application> => {
    const res = await api.put(`/applications/${id}/status`, { new_status, remarks, benefit_amount });
    return res.data;
  }
};

// ==================== DOCUMENTS API ====================
export const documentApi = {
  getMyDocuments: async (): Promise<DocumentItem[]> => {
    const res = await api.get('/documents/my');
    return res.data;
  },
  uploadNewDocument: async (documentType: string, file: File, applicationId?: number): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    if (applicationId) {
      formData.append('application_id', String(applicationId));
    }
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  uploadDocument: async (applicationId: number, documentType: string, file: File) => {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    const res = await api.post(`/documents/${applicationId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  updateDocument: async (documentId: number, documentType?: string, file?: File): Promise<DocumentItem> => {
    const formData = new FormData();
    if (documentType) {
      formData.append('document_type', documentType);
    }
    if (file) {
      formData.append('file', file);
    }
    const res = await api.put(`/documents/${documentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  deleteDocument: async (documentId: number): Promise<{ message: string; id: number; document_type?: string }> => {
    const res = await api.delete(`/documents/${documentId}`);
    return res.data;
  },
  getDocuments: async (applicationId: number) => {
    const res = await api.get(`/documents/${applicationId}`);
    return res.data;
  },
  verifyDocument: async (documentId: number, status: string, admin_remarks?: string) => {
    const res = await api.put(`/documents/${documentId}/verify`, { status, admin_remarks });
    return res.data;
  },
  getDocumentDownloadUrl: (documentId: number) => {
    const token = localStorage.getItem('token');
    return `/api/v1/documents/${documentId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  getDocumentViewUrl: (documentId: number) => {
    const token = localStorage.getItem('token');
    return `/api/v1/documents/${documentId}/view${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  }
};

// ==================== NOTIFICATIONS API ====================
export const notificationApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markRead: async (id: number) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.post('/notifications/read-all');
    return res.data;
  }
};

// ==================== ADMIN API ====================
export const adminApi = {
  getAnalytics: async (): Promise<AdminAnalytics> => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },
  getWorkers: async (params?: { occupation?: string; state?: string; search?: string }) => {
    const res = await api.get('/admin/workers', { params });
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data;
  },
  getExportReportUrl: (type: 'workers' | 'applications' | 'schemes') => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/admin/reports/export-csv?report_type=${type}&token=${token}`;
  }
};

// ==================== RAG CHATBOT API ====================
export const chatbotApi = {
  query: async (query: string) => {
    const res = await api.post('/chatbot/query', { query });
    return res.data;
  }
};

// ==================== ISSUE REPORTING API ====================
export const issueApi = {
  submitIssue: async (payload: IssueReportCreatePayload): Promise<IssueReport> => {
    const res = await api.post('/issues', payload);
    return res.data;
  },
  getMyIssues: async (): Promise<IssueReport[]> => {
    const res = await api.get('/issues/my');
    return res.data;
  },
  getAllIssues: async (params?: { status_filter?: string; category?: string; search?: string }): Promise<IssueReport[]> => {
    const res = await api.get('/issues', { params });
    return res.data;
  },
  getIssueDetail: async (issueId: number): Promise<IssueReport> => {
    const res = await api.get(`/issues/${issueId}`);
    return res.data;
  },
  updateIssueStatus: async (issueId: number, status: string, admin_response?: string): Promise<IssueReport> => {
    const res = await api.put(`/issues/${issueId}/status`, { status, admin_response });
    return res.data;
  }
};

// ==================== TRUSTED PORTALS API ====================
export const portalsApi = {
  getPortals: async (params?: {
    level?: string;
    state?: string;
    category?: string;
    language?: string;
    status?: string;
    search?: string;
  }): Promise<TrustedPortal[]> => {
    const res = await api.get('/portals', { params });
    return res.data;
  },
  getPortalById: async (id: string): Promise<TrustedPortal> => {
    const res = await api.get(`/portals/${id}`);
    return res.data;
  },
  getSchemesDirectory: async (params?: {
    category?: string;
    state?: string;
    portal_id?: string;
    search?: string;
  }): Promise<PortalScheme[]> => {
    const res = await api.get('/portals/schemes/directory', { params });
    return res.data;
  },
  recordVerificationReview: async (id: string, payload: { verification_status?: string; notes?: string }): Promise<TrustedPortal> => {
    const res = await api.post(`/portals/${id}/verify-review`, payload);
    return res.data;
  }
};

