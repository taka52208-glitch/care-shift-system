import { Router } from 'express';
import { db } from '../config/database.js';

const router = Router();

// GET dashboard statistics
router.get('/stats', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonth = `${year}-${month}`;

  // Staff count
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number };

  // Shifts this month
  const shiftsThisMonth = db.prepare(
    'SELECT COUNT(*) as count FROM shifts WHERE date LIKE ?'
  ).get(`${currentMonth}%`) as { count: number };

  // Calculate expected shifts (staff * days in month)
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  const expectedShifts = staffCount.count * daysInMonth;
  const completionRate = expectedShifts > 0
    ? Math.round((shiftsThisMonth.count / expectedShifts) * 100)
    : 0;

  // Pending requests
  const pendingRequests = db.prepare(
    "SELECT COUNT(*) as count FROM requests WHERE status = 'pending'"
  ).get() as { count: number };

  // Shifts by pattern this month
  const shiftsByPattern = db.prepare(`
    SELECT p.name, p.color, COUNT(s.id) as count
    FROM patterns p
    LEFT JOIN shifts s ON p.id = s.pattern_id AND s.date LIKE ?
    GROUP BY p.id
    ORDER BY p.id
  `).all(`${currentMonth}%`) as Array<{ name: string; color: string; count: number }>;

  res.json({
    staffCount: staffCount.count,
    currentMonth: `${year}年${parseInt(month)}月`,
    completionRate,
    pendingRequests: pendingRequests.count,
    shiftsThisMonth: shiftsThisMonth.count,
    shiftsByPattern
  });
});

// GET weekly shifts for current week
router.get('/weekly', (req, res) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push(date.toISOString().split('T')[0]);
  }

  const shifts = db.prepare(`
    SELECT s.date, st.name as staff_name, p.name as pattern_name, p.code, p.color
    FROM shifts s
    JOIN staff st ON s.staff_id = st.id
    JOIN patterns p ON s.pattern_id = p.id
    WHERE s.date >= ? AND s.date <= ?
    ORDER BY s.date, st.name
  `).all(weekDays[0], weekDays[6]) as Array<{
    date: string;
    staff_name: string;
    pattern_name: string;
    code: string;
    color: string;
  }>;

  // Group by date
  const weeklyData = weekDays.map(date => {
    const dayShifts = shifts.filter(s => s.date === date);
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
});

// GET recent activity
router.get('/activity', (req, res) => {
  const recentRequests = db.prepare(`
    SELECT id, staff_name, request_type, date, status, created_at
    FROM requests
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  res.json(recentRequests);
});

export default router;
