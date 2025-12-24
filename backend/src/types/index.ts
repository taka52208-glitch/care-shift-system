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
