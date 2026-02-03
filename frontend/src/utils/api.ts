const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://care-shift-system.onrender.com/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  if (res.status === 204) return {} as T;
  return res.json();
}

// Staff API
export const staffApi = {
  getAll: () => request<Staff[]>('/staff'),
  getById: (id: string) => request<Staff>(`/staff/${id}`),
  create: (data: Omit<Staff, 'id' | 'createdAt'>) =>
    request<Staff>('/staff', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Staff>) =>
    request<Staff>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/staff/${id}`, { method: 'DELETE' }),
};

// Shift API
export const shiftApi = {
  getAll: (month?: string) => request<Shift[]>(`/shifts${month ? `?month=${month}` : ''}`),
  getByStaff: (staffId: string) => request<Shift[]>(`/shifts/staff/${staffId}`),
  create: (data: Omit<Shift, 'id'>) =>
    request<Shift>('/shifts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Shift>) =>
    request<Shift>(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/shifts/${id}`, { method: 'DELETE' }),
  bulkUpdate: (items: Partial<Shift>[]) =>
    request<{ success: boolean }>('/shifts/bulk', { method: 'POST', body: JSON.stringify({ items }) }),
  autoGenerate: (month: string, clearExisting: boolean = true) =>
    request<AutoGenerateResult>('/shifts/auto-generate', {
      method: 'POST',
      body: JSON.stringify({ month, clearExisting })
    }),
  clearMonth: (month: string) =>
    request<{ success: boolean; deleted: number }>(`/shifts/month/${month}`, { method: 'DELETE' }),
};

// Pattern API
export const patternApi = {
  getAll: () => request<ShiftPattern[]>('/patterns'),
  create: (data: Omit<ShiftPattern, 'id'>) =>
    request<ShiftPattern>('/patterns', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ShiftPattern>) =>
    request<ShiftPattern>(`/patterns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/patterns/${id}`, { method: 'DELETE' }),
};

// Constraint API
export const constraintApi = {
  getAll: () => request<Constraint[]>('/constraints'),
  update: (items: { id: string; value: number | boolean }[]) =>
    request<Constraint[]>('/constraints', { method: 'PUT', body: JSON.stringify({ items }) }),
};

// Request API
export const requestApi = {
  getAll: (status?: string, month?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (month) params.append('month', month);
    const query = params.toString();
    return request<ShiftRequest[]>(`/requests${query ? `?${query}` : ''}`);
  },
  create: (data: Omit<ShiftRequest, 'id' | 'status' | 'createdAt'>) =>
    request<ShiftRequest>('/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<ShiftRequest>(`/requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete: (id: string) =>
    request<void>(`/requests/${id}`, { method: 'DELETE' }),
};

// Types
export interface Staff {
  id: string;
  name: string;
  qualification: string;
  employmentType: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export interface ShiftPattern {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakTime: number;
  color: string;
}

export interface Shift {
  id: string;
  staffId: string;
  date: string;
  patternId: string;
}

export interface ShiftRequest {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  requestType: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Constraint {
  id: string;
  category: string;
  key: string;
  value: number | boolean;
}

export interface AutoGenerateResult {
  success: boolean;
  message: string;
  shiftsGenerated: number;
  warnings: string[];
  errors?: string[];
}

export interface StaffReport {
  staffId: string;
  name: string;
  qualification: string;
  employmentType: string;
  workDays: number;
  totalHours: number;
  nightShifts: number;
  earlyShifts: number;
  dayShifts: number;
  lateShifts: number;
  holidays: number;
  overtime: number;
}

export interface MonthlyReport {
  month: string;
  totalWorkDays: number;
  totalHours: number;
  totalNightShifts: number;
  totalOvertime: number;
  staffReports: StaffReport[];
  shiftDistribution: {
    early: number;
    day: number;
    late: number;
    night: number;
    off: number;
  };
}

// Report API
export const reportApi = {
  getMonthly: (month: string) => request<MonthlyReport>(`/reports/${month}`),
};
