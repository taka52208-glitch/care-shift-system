// Re-export Prisma types
export type {
  Tenant,
  User,
  Staff,
  ShiftPattern,
  Shift,
  ShiftRequest,
  Constraint,
  SubscriptionStatus,
  UserRole,
  RequestStatus,
} from '@prisma/client';

// ============================================
// API Response Types (for backward compatibility)
// ============================================

export interface StaffResponse {
  id: string;
  name: string;
  qualification: string | null;
  employmentType: string | null;
  phone: string | null;
  email?: string | null;
  createdAt: string;
}

export interface ShiftPatternResponse {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakTime: number;
  color: string;
}

export interface ShiftResponse {
  id: string;
  staffId: string;
  date: string;
  patternId: string;
}

export interface ShiftRequestResponse {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  requestType: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ConstraintResponse {
  id: string;
  category: string;
  key: string;
  value: number | boolean | string;
}

// ============================================
// Auth Types
// ============================================

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

// ============================================
// Request Types
// ============================================

export interface RegisterRequest {
  tenantName: string;
  subdomain: string;
  email: string;
  password: string;
  userName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ============================================
// Converters (Prisma -> API Response)
// ============================================

import type { Staff, ShiftPattern, Shift, ShiftRequest, Constraint } from '@prisma/client';

export function toStaffResponse(staff: Staff): StaffResponse {
  return {
    id: staff.id,
    name: staff.name,
    qualification: staff.qualification,
    employmentType: staff.employmentType,
    phone: staff.phone,
    email: staff.email,
    createdAt: staff.createdAt.toISOString(),
  };
}

export function toShiftPatternResponse(pattern: ShiftPattern): ShiftPatternResponse {
  return {
    id: pattern.id,
    name: pattern.name,
    code: pattern.code,
    startTime: pattern.startTime,
    endTime: pattern.endTime,
    breakTime: pattern.breakTime,
    color: pattern.color,
  };
}

export function toShiftResponse(shift: Shift): ShiftResponse {
  return {
    id: shift.id,
    staffId: shift.staffId,
    date: shift.date,
    patternId: shift.patternId,
  };
}

export function toShiftRequestResponse(
  request: ShiftRequest & { staff?: { name: string } }
): ShiftRequestResponse {
  return {
    id: request.id,
    staffId: request.staffId,
    staffName: request.staff?.name || '',
    date: request.date,
    requestType: request.requestType,
    reason: request.reason,
    status: request.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
    createdAt: request.createdAt.toISOString(),
  };
}

export function toConstraintResponse(constraint: Constraint): ConstraintResponse {
  // Try to parse as number or boolean
  let parsedValue: number | boolean | string = constraint.value;
  const numValue = Number(constraint.value);
  if (!isNaN(numValue)) {
    parsedValue = numValue;
  } else if (constraint.value === 'true') {
    parsedValue = true;
  } else if (constraint.value === 'false') {
    parsedValue = false;
  }

  return {
    id: constraint.id,
    category: constraint.category,
    key: constraint.key,
    value: parsedValue,
  };
}
