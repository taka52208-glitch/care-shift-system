import type { Staff, ShiftPattern, Shift, ShiftRequest, Constraint } from '../types/index.js';

// In-memory data store
export const staffList: Staff[] = [
  { id: '1', name: '山田太郎', qualification: '介護福祉士', employmentType: '正社員', phone: '090-1234-5678', createdAt: '2025-01-01' },
  { id: '2', name: '佐藤花子', qualification: 'ヘルパー2級', employmentType: 'パート', phone: '090-2345-6789', createdAt: '2025-01-01' },
  { id: '3', name: '鈴木一郎', qualification: '介護福祉士', employmentType: '正社員', phone: '090-3456-7890', createdAt: '2025-01-01' },
  { id: '4', name: '田中美咲', qualification: 'ヘルパー2級', employmentType: 'パート', phone: '090-4567-8901', createdAt: '2025-01-01' },
  { id: '5', name: '高橋健二', qualification: '介護福祉士', employmentType: '正社員', phone: '090-5678-9012', createdAt: '2025-01-01' },
];

export const patterns: ShiftPattern[] = [
  { id: '1', name: '早番', code: 'E', startTime: '07:00', endTime: '16:00', breakTime: 60, color: '#fbbf24' },
  { id: '2', name: '日勤', code: 'D', startTime: '09:00', endTime: '18:00', breakTime: 60, color: '#22c55e' },
  { id: '3', name: '遅番', code: 'L', startTime: '12:00', endTime: '21:00', breakTime: 60, color: '#3b82f6' },
  { id: '4', name: '夜勤', code: 'N', startTime: '21:00', endTime: '07:00', breakTime: 120, color: '#8b5cf6' },
  { id: '5', name: '公休', code: 'O', startTime: '-', endTime: '-', breakTime: 0, color: '#94a3b8' },
];

export const shifts: Shift[] = [];

export const requests: ShiftRequest[] = [
  { id: '1', staffId: '1', staffName: '山田太郎', date: '2024-12-25', requestType: '休み', reason: '家族行事のため', status: 'pending', createdAt: '2025-01-01' },
  { id: '2', staffId: '2', staffName: '佐藤花子', date: '2024-12-31', requestType: '休み', reason: '年末年始帰省', status: 'approved', createdAt: '2025-01-01' },
];

export const constraints: Constraint[] = [
  { id: '1', category: 'staffing', key: 'minDayStaff', value: 3 },
  { id: '2', category: 'staffing', key: 'minNightStaff', value: 2 },
  { id: '3', category: 'staffing', key: 'minQualifiedDay', value: 1 },
  { id: '4', category: 'workLimit', key: 'maxConsecutiveDays', value: 5 },
  { id: '5', category: 'workLimit', key: 'maxNightShifts', value: 8 },
  { id: '6', category: 'workLimit', key: 'restAfterNight', value: 1 },
  { id: '7', category: 'holiday', key: 'weeklyHolidays', value: 2 },
  { id: '8', category: 'holiday', key: 'minMonthlyHolidays', value: 8 },
];
