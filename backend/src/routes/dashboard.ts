import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET dashboard statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    // Staff count
    const staffCount = await prisma.staff.count({
      where: { tenantId }
    });

    // Shifts this month
    const shiftsThisMonth = await prisma.shift.count({
      where: {
        tenantId,
        date: {
          startsWith: currentMonth
        }
      }
    });

    // Calculate expected shifts (staff * days in month)
    const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    const expectedShifts = staffCount * daysInMonth;
    const completionRate = expectedShifts > 0
      ? Math.round((shiftsThisMonth / expectedShifts) * 100)
      : 0;

    // Pending requests
    const pendingRequests = await prisma.shiftRequest.count({
      where: {
        tenantId,
        status: 'PENDING'
      }
    });

    // Shifts by pattern this month
    const patterns = await prisma.shiftPattern.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' }
    });

    const shiftsByPattern = await Promise.all(
      patterns.map(async (pattern) => {
        const count = await prisma.shift.count({
          where: {
            tenantId,
            patternId: pattern.id,
            date: {
              startsWith: currentMonth
            }
          }
        });
        return {
          name: pattern.name,
          color: pattern.color,
          count
        };
      })
    );

    res.json({
      staffCount,
      currentMonth: `${year}年${parseInt(month)}月`,
      completionRate,
      pendingRequests,
      shiftsThisMonth,
      shiftsByPattern
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'ダッシュボード統計の取得に失敗しました' });
  }
});

// GET weekly shifts for current week
router.get('/weekly', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date.toISOString().split('T')[0]);
    }

    const shifts = await prisma.shift.findMany({
      where: {
        tenantId,
        date: {
          gte: weekDays[0],
          lte: weekDays[6]
        }
      },
      include: {
        staff: true,
        pattern: true
      },
      orderBy: [
        { date: 'asc' },
        { staff: { name: 'asc' } }
      ]
    });

    // Group by date
    const weeklyData = weekDays.map(date => {
      const dayShifts = shifts
        .filter(s => s.date === date)
        .map(s => ({
          date: s.date,
          staff_name: s.staff.name,
          pattern_name: s.pattern.name,
          code: s.pattern.code,
          color: s.pattern.color
        }));
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][new Date(date).getDay()];
      return {
        date,
        dayOfWeek,
        day: new Date(date).getDate(),
        shifts: dayShifts,
        count: dayShifts.length
      };
    });

    res.json(weeklyData);
  } catch (error) {
    console.error('Weekly shifts error:', error);
    res.status(500).json({ error: '週間シフトの取得に失敗しました' });
  }
});

// GET recent activity
router.get('/activity', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    const recentRequests = await prisma.shiftRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        staff: true
      }
    });

    const activity = recentRequests.map(request => ({
      id: request.id,
      staff_name: request.staff.name,
      request_type: request.requestType,
      date: request.date,
      status: request.status.toLowerCase(),
      created_at: request.createdAt.toISOString()
    }));

    res.json(activity);
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ error: 'アクティビティの取得に失敗しました' });
  }
});

export default router;
