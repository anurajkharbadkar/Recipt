import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const API_URL = RAW_API_URL.endsWith('/api/v1')
  ? RAW_API_URL
  : `${RAW_API_URL.replace(/\/+$/, '')}/api/v1`;

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

// A 401 from these two means "your credentials were rejected" (wrong
// password, unknown phone, bad mandal code), not "your session expired" —
// there was never a session to expire. Auto-logout-and-redirect on those
// would bounce the login page to itself before handleLogin's own catch
// block ever gets to show *why* — the browser navigation tears the page
// down first, so the real backend message (already a well-written, non-
// technical one — see AuthService.login) never had a chance to render.
const SKIP_AUTH_RECOVERY = ['/auth/login', '/auth/register'];

// Exported (not just inlined in the interceptor below) so this is unit-
// testable on its own — a regression here silently reintroduces the "wrong
// password reloads the login page with no message" bug, which nothing
// short of actually submitting the login form would otherwise catch.
export function isAuthRecoveryExemptUrl(url: string | undefined): boolean {
  return !!url && SKIP_AUTH_RECOVERY.some((path) => url.includes(path));
}

// Response interceptor — auto refresh JWT
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = isAuthRecoveryExemptUrl(original?.url);
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
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
  // mandalCode is omitted entirely (not sent as '') for the Mandal Admin
  // tab — the backend's optional-mandalCode branch keys off the field being
  // absent, not empty (see LoginDto/AuthService.login).
  login: (phone: string, password: string, mandalCode?: string) =>
    apiClient.post('/auth/login', mandalCode ? { mandalCode, phone, password } : { phone, password }).then(r => r.data),
  getMe: () => apiClient.get('/auth/me').then(r => r.data),
};

// Organizations
export const orgsApi = {
  getMe: () => apiClient.get('/organizations/me').then(r => r.data),
  update: (data: any) => apiClient.patch('/organizations/me', data).then(r => r.data),
  getIntegrationsStatus: () => apiClient.get('/organizations/me/integrations-status').then(r => r.data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return apiClient.post('/organizations/me/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  /** Uploads a custom idol/darshan photo for the Interactive Pavti — returns { url }, not persisted server-side (saved via the normal Settings form). */
  uploadIdolImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/organizations/me/idol-image', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data as { url: string });
  },
  getAreas: () => apiClient.get('/organizations/areas').then(r => r.data),
  createArea: (data: any) => apiClient.post('/organizations/areas', data).then(r => r.data),
  deleteArea: (id: string) => apiClient.delete(`/organizations/areas/${id}`).then(r => r.data),
  getCategories: (kind: 'EXPENSE' | 'DONATION') => apiClient.get('/organizations/categories', { params: { kind } }).then(r => r.data),
  createCategory: (kind: 'EXPENSE' | 'DONATION', label: string) => apiClient.post('/organizations/categories', { kind, label }).then(r => r.data),
  deleteCategory: (id: string) => apiClient.delete(`/organizations/categories/${id}`).then(r => r.data),
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
  update: (id: string, data: any) => apiClient.patch(`/receipts/${id}`, data).then(r => r.data),
  void: (id: string, reason: string) => apiClient.patch(`/receipts/${id}/void`, { reason }).then(r => r.data),
  exportCsv: (campaignId?: string) => apiClient.get('/receipts/export/csv', { params: { campaignId }, responseType: 'blob' }).then(r => r.data),
  donors: () => apiClient.get('/receipts/donors').then(r => r.data),
  updateStatus: (id: string, status: string) => apiClient.patch(`/receipts/${id}/status`, { status }).then(r => r.data),
  /** PNG snapshot of the pavti — what actually gets attached on a WhatsApp share (see lib/whatsappShare.ts). */
  getImage: (id: string) => apiClient.get(`/receipts/${id}/image`, { responseType: 'blob' }).then(r => r.data as Blob),
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
  incomeExpenditure: (campaignId?: string) => apiClient.get('/reports/income-expenditure', { params: { campaignId } }).then(r => r.data),
  downloadIncomeExpenditurePdf: (campaignId?: string) => apiClient.get('/reports/income-expenditure/pdf', { params: { campaignId }, responseType: 'blob' }).then(r => r.data),
  downloadExpensesCsv: (campaignId?: string) => apiClient.get('/reports/expenses/csv', { params: { campaignId }, responseType: 'blob' }).then(r => r.data),
};

// Members (सभासद नोंदणी — org member registry)
export const membersApi = {
  list: () => apiClient.get('/members').then(r => r.data),
  create: (data: any) => apiClient.post('/members', data).then(r => r.data),
  bulkCreate: (names: string[]) => apiClient.post('/members/bulk', { names }).then(r => r.data),
  update: (id: string, data: any) => apiClient.patch(`/members/${id}`, data).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/members/${id}`).then(r => r.data),
};

// Internal Collections (Mandal Contribution / member subscription roster)
export const internalCollectionsApi = {
  declare: (data: any) => apiClient.post('/internal-collections/declare', data).then(r => r.data),
  roster: (campaignId: string) => apiClient.get('/internal-collections/roster', { params: { campaignId } }).then(r => r.data),
};

// Cashfree — sandbox test surface only (see Digital_Pavti_Cashfree_EasySplit_Developer_Handover.md).
// Not the eventual public donation flow; every call here needs the staff
// bearer token apiClient already attaches.
export const cashfreeApi = {
  createOrder: (data: { amount: number; customerId: string; customerPhone: string; customerEmail?: string }) =>
    apiClient.post('/payments/cashfree/orders', data).then(r => r.data),
  getOrder: (orderId: string) => apiClient.get(`/payments/cashfree/orders/${orderId}`).then(r => r.data),
  getOrderPayments: (orderId: string) => apiClient.get(`/payments/cashfree/orders/${orderId}/payments`).then(r => r.data),
};
