import { Router } from 'express';
import { db } from '../config/database.js';

const router = Router();

interface ShiftRow {
  staff_id: string;
  date: string;
  pattern_id: string;
}

interface StaffRow {
  id: string;
  name: string;
  qualification: string;
  employment_type: string;
}

interface PatternRow {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  break_time: number;
}

interface StaffReport {
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

interface MonthlyReport {
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

// Calculate hours from time strings
function calculateHours(startTime: string, endTime: string, breakTime: number): number {
  if (startTime === '-' || endTime === '-') return 0;

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const workMinutes = endMinutes - startMinutes - breakTime;
  return workMinutes / 60;
}

// GET monthly report
router.get('/:month', (req, res) => {
  const { month } = req.params;

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: '月の形式が正しくありません (YYYY-MM)' });
  }

  // Get all staff
  const staffList = db.prepare('SELECT * FROM staff').all() as StaffRow[];

  // Get all patterns
  const patterns = db.prepare('SELECT * FROM patterns').all() as PatternRow[];
  const patternMap = new Map<string, PatternRow>();
  for (const p of patterns) {
    patternMap.set(p.id, p);
  }

  // Get shifts for the month
  const shifts = db.prepare('SELECT * FROM shifts WHERE date LIKE ?').all(`${month}%`) as ShiftRow[];

  // Initialize distribution counters
  const shiftDistribution = { early: 0, day: 0, late: 0, night: 0, off: 0 };

  // Calculate report for each staff
  const staffReports: StaffReport[] = staffList.map(staff => {
    const staffShifts = shifts.filter(s => s.staff_id === staff.id);

    let workDays = 0;
    let totalHours = 0;
    let nightShifts = 0;
    let earlyShifts = 0;
    let dayShifts = 0;
    let lateShifts = 0;
    let holidays = 0;

    for (const shift of staffShifts) {
      const pattern = patternMap.get(shift.pattern_id);
      if (!pattern) continue;

      switch (pattern.code) {
        case 'E': // 早番
          earlyShifts++;
          workDays++;
          totalHours += calculateHours(pattern.start_time, pattern.end_time, pattern.break_time);
          shiftDistribution.early++;
          break;
        case 'D': // 日勤
          dayShifts++;
          workDays++;
          totalHours += calculateHours(pattern.start_time, pattern.end_time, pattern.break_time);
          shiftDistribution.day++;
          break;
        case 'L': // 遅番
          lateShifts++;
          workDays++;
          totalHours += calculateHours(pattern.start_time, pattern.end_time, pattern.break_time);
          shiftDistribution.late++;
          break;
        case 'N': // 夜勤
          nightShifts++;
          workDays++;
          totalHours += calculateHours(pattern.start_time, pattern.end_time, pattern.break_time);
          shiftDistribution.night++;
          break;
        case 'O': // 公休
          holidays++;
          shiftDistribution.off++;
          break;
      }
    }

    // Calculate overtime (over 8 hours per day average)
    const standardHours = workDays * 8;
    const overtime = Math.max(0, totalHours - standardHours);

    return {
      staffId: staff.id,
      name: staff.name,
      qualification: staff.qualification,
      employmentType: staff.employment_type,
      workDays,
      totalHours: Math.round(totalHours * 10) / 10,
      nightShifts,
      earlyShifts,
      dayShifts,
      lateShifts,
      holidays,
      overtime: Math.round(overtime * 10) / 10
    };
  });

  // Calculate totals
  const totalWorkDays = staffReports.reduce((sum, r) => sum + r.workDays, 0);
  const totalHours = staffReports.reduce((sum, r) => sum + r.totalHours, 0);
  const totalNightShifts = staffReports.reduce((sum, r) => sum + r.nightShifts, 0);
  const totalOvertime = staffReports.reduce((sum, r) => sum + r.overtime, 0);

  const report: MonthlyReport = {
    month,
    totalWorkDays,
    totalHours: Math.round(totalHours * 10) / 10,
    totalNightShifts,
    totalOvertime: Math.round(totalOvertime * 10) / 10,
    staffReports,
    shiftDistribution
  };

  res.json(report);
});

// GET staff report for a specific month
router.get('/:month/staff/:staffId', (req, res) => {
  const { month, staffId } = req.params;

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: '月の形式が正しくありません (YYYY-MM)' });
  }

  // Get staff
  const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(staffId) as StaffRow | undefined;
  if (!staff) {
    return res.status(404).json({ error: 'スタッフが見つかりません' });
  }

  // Get all patterns
  const patterns = db.prepare('SELECT * FROM patterns').all() as PatternRow[];
  const patternMap = new Map<string, PatternRow>();
  for (const p of patterns) {
    patternMap.set(p.id, p);
  }

  // Get shifts for the month
  const shifts = db.prepare(
    'SELECT * FROM shifts WHERE staff_id = ? AND date LIKE ? ORDER BY date'
  ).all(staffId, `${month}%`) as ShiftRow[];

  // Build detailed shift list
  const shiftDetails = shifts.map(shift => {
    const pattern = patternMap.get(shift.pattern_id);
    return {
      date: shift.date,
      patternCode: pattern?.code || '',
      patternName: pattern?.name || '',
      hours: pattern ? calculateHours(pattern.start_time, pattern.end_time, pattern.break_time) : 0
    };
  });

  res.json({
    staff: {
      id: staff.id,
      name: staff.name,
      qualification: staff.qualification,
      employmentType: staff.employment_type
    },
    month,
    shifts: shiftDetails
  });
});

export default router;
