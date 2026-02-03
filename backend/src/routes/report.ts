import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

interface StaffReport {
  staffId: string;
  name: string;
  qualification: string | null;
  employmentType: string | null;
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
router.get('/:month', async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.params;
    const tenantId = req.tenantId!;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: '月の形式が正しくありません (YYYY-MM)' });
    }

    // Get all staff
    const staffList = await prisma.staff.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });

    // Get all patterns
    const patterns = await prisma.shiftPattern.findMany({
      where: { tenantId }
    });
    const patternMap = new Map(patterns.map(p => [p.id, p]));

    // Get shifts for the month with pattern info
    const shifts = await prisma.shift.findMany({
      where: {
        tenantId,
        date: {
          startsWith: month
        }
      },
      include: {
        pattern: true
      }
    });

    // Initialize distribution counters
    const shiftDistribution = { early: 0, day: 0, late: 0, night: 0, off: 0 };

    // Calculate report for each staff
    const staffReports: StaffReport[] = staffList.map(staff => {
      const staffShifts = shifts.filter(s => s.staffId === staff.id);

      let workDays = 0;
      let totalHours = 0;
      let nightShifts = 0;
      let earlyShifts = 0;
      let dayShifts = 0;
      let lateShifts = 0;
      let holidays = 0;

      for (const shift of staffShifts) {
        const pattern = patternMap.get(shift.patternId);
        if (!pattern) continue;

        switch (pattern.code) {
          case 'E': // 早番
            earlyShifts++;
            workDays++;
            totalHours += calculateHours(pattern.startTime, pattern.endTime, pattern.breakTime);
            shiftDistribution.early++;
            break;
          case 'D': // 日勤
            dayShifts++;
            workDays++;
            totalHours += calculateHours(pattern.startTime, pattern.endTime, pattern.breakTime);
            shiftDistribution.day++;
            break;
          case 'L': // 遅番
            lateShifts++;
            workDays++;
            totalHours += calculateHours(pattern.startTime, pattern.endTime, pattern.breakTime);
            shiftDistribution.late++;
            break;
          case 'N': // 夜勤
            nightShifts++;
            workDays++;
            totalHours += calculateHours(pattern.startTime, pattern.endTime, pattern.breakTime);
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
        employmentType: staff.employmentType,
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
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: '月次レポートの取得に失敗しました' });
  }
});

// GET staff report for a specific month
router.get('/:month/staff/:staffId', async (req: AuthRequest, res: Response) => {
  try {
    const { month, staffId } = req.params;
    const tenantId = req.tenantId!;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: '月の形式が正しくありません (YYYY-MM)' });
    }

    // Get staff
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, tenantId }
    });

    if (!staff) {
      return res.status(404).json({ error: 'スタッフが見つかりません' });
    }

    // Get all patterns
    const patterns = await prisma.shiftPattern.findMany({
      where: { tenantId }
    });
    const patternMap = new Map(patterns.map(p => [p.id, p]));

    // Get shifts for the month
    const shifts = await prisma.shift.findMany({
      where: {
        tenantId,
        staffId,
        date: {
          startsWith: month
        }
      },
      orderBy: { date: 'asc' }
    });

    // Build detailed shift list
    const shiftDetails = shifts.map(shift => {
      const pattern = patternMap.get(shift.patternId);
      return {
        date: shift.date,
        patternCode: pattern?.code || '',
        patternName: pattern?.name || '',
        hours: pattern ? calculateHours(pattern.startTime, pattern.endTime, pattern.breakTime) : 0
      };
    });

    res.json({
      staff: {
        id: staff.id,
        name: staff.name,
        qualification: staff.qualification,
        employmentType: staff.employmentType
      },
      month,
      shifts: shiftDetails
    });
  } catch (error) {
    console.error('Staff report error:', error);
    res.status(500).json({ error: 'スタッフレポートの取得に失敗しました' });
  }
});

export default router;
