import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto refresh JWT
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          useAuthStore.getState().setAuth(data);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(original);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ─── API Functions ────────────────────────────────────────────────────────────

// Auth
export const authApi = {
  register: (data: any) => apiClient.post('/auth/register', data).then(r => r.data),
  login: (phone: string, password: string) => apiClient.post('/auth/login', { phone, password }).then(r => r.data),
  sendOtp: (phone: string) => apiClient.post('/auth/otp/send', { phone }).then(r => r.data),
  verifyOtp: (phone: string, otp: string) => apiClient.post('/auth/otp/verify', { phone, otp }).then(r => r.data),
  getMe: () => apiClient.get('/auth/me').then(r => r.data),
};

// Organizations
export const orgsApi = {
  getMe: () => apiClient.get('/organizations/me').then(r => r.data),
  update: (data: any) => apiClient.patch('/organizations/me', data).then(r => r.data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return apiClient.post('/organizations/me/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  uploadReceiptTemplateImage: (file: File, width: number, height: number) => {
    const form = new FormData();
    form.append('image', file);
    form.append('width', String(width));
    form.append('height', String(height));
    return apiClient.post('/organizations/me/receipt-template-image', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  getAreas: () => apiClient.get('/organizations/areas').then(r => r.data),
  createArea: (data: any) => apiClient.post('/organizations/areas', data).then(r => r.data),
  deleteArea: (id: string) => apiClient.delete(`/organizations/areas/${id}`).then(r => r.data),
};

// Campaigns
export const campaignsApi = {
  list: () => apiClient.get('/campaigns').then(r => r.data),
  get: (id: string) => apiClient.get(`/campaigns/${id}`).then(r => r.data),
  getStats: (id: string) => apiClient.get(`/campaigns/${id}/stats`).then(r => r.data),
  create: (data: any) => apiClient.post('/campaigns', data).then(r => r.data),
  update: (id: string, data: any) => apiClient.patch(`/campaigns/${id}`, data).then(r => r.data),
  activate: (id: string) => apiClient.patch(`/campaigns/${id}/activate`).then(r => r.data),
  complete: (id: string) => apiClient.patch(`/campaigns/${id}/complete`).then(r => r.data),
};

// Receipts
export const receiptsApi = {
  list: (params?: any) => apiClient.get('/receipts', { params }).then(r => r.data),
  get: (id: string) => apiClient.get(`/receipts/${id}`).then(r => r.data),
  verifyPublic: (id: string) => apiClient.get(`/receipts/verify/${id}`).then(r => r.data),
  create: (data: any) => apiClient.post('/receipts', data).then(r => r.data),
  void: (id: string, reason: string) => apiClient.patch(`/receipts/${id}/void`, { reason }).then(r => r.data),
  resend: (id: string) => apiClient.post(`/receipts/${id}/resend`).then(r => r.data),
  exportCsv: (campaignId?: string) => apiClient.get('/receipts/export/csv', { params: { campaignId }, responseType: 'blob' }).then(r => r.data),
  donors: () => apiClient.get('/receipts/donors').then(r => r.data),
  updateStatus: (id: string, status: string) => apiClient.patch(`/receipts/${id}/status`, { status }).then(r => r.data),
};

// Collectors
export const collectorsApi = {
  list: () => apiClient.get('/collectors').then(r => r.data),
  get: (id: string) => apiClient.get(`/collectors/${id}`).then(r => r.data),
  getStats: (id: string, campaignId?: string) => apiClient.get(`/collectors/${id}/stats`, { params: { campaignId } }).then(r => r.data),
  create: (data: any) => apiClient.post('/collectors', data).then(r => r.data),
  update: (id: string, data: any) => apiClient.patch(`/collectors/${id}`, data).then(r => r.data),
};

// Expenses
export const expensesApi = {
  list: (campaignId?: string) => apiClient.get('/expenses', { params: { campaignId } }).then(r => r.data),
  create: (data: any) => apiClient.post('/expenses', data).then(r => r.data),
  approve: (id: string) => apiClient.patch(`/expenses/${id}/approve`).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/expenses/${id}`).then(r => r.data),
  downloadVoucher: (id: string) => apiClient.get(`/expenses/${id}/voucher`, { responseType: 'blob' }).then(r => r.data),
};

// Reports
export const reportsApi = {
  summary: (campaignId?: string) => apiClient.get('/reports/summary', { params: { campaignId } }).then(r => r.data),
  daily: (campaignId?: string, days?: number) => apiClient.get('/reports/daily', { params: { campaignId, days } }).then(r => r.data),
  collectors: (campaignId?: string) => apiClient.get('/reports/collectors', { params: { campaignId } }).then(r => r.data),
  areas: (campaignId?: string) => apiClient.get('/reports/areas', { params: { campaignId } }).then(r => r.data),
  categories: (campaignId?: string) => apiClient.get('/reports/categories', { params: { campaignId } }).then(r => r.data),
  topDonors: (campaignId?: string) => apiClient.get('/reports/top-donors', { params: { campaignId } }).then(r => r.data),
  collectionType: (campaignId?: string) => apiClient.get('/reports/collection-type', { params: { campaignId } }).then(r => r.data),
  incomeExpenseTrend: (campaignId?: string, days?: number) => apiClient.get('/reports/income-expense-trend', { params: { campaignId, days } }).then(r => r.data),
};

// Permissions (Access Management — role defaults)
export const permissionsApi = {
  getRoleDefaults: () => apiClient.get('/permissions/roles').then(r => r.data),
  updateRoleDefaults: (matrix: any[]) => apiClient.put('/permissions/roles', matrix).then(r => r.data),
};
