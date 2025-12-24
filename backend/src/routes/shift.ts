import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { generateShifts, clearShifts } from '../services/shiftGenerator.js';

const router = Router();

interface ShiftRow {
  id: string;
  staff_id: string;
  date: string;
  pattern_id: string;
}

const toShift = (row: ShiftRow) => ({
  id: row.id,
  staffId: row.staff_id,
  date: row.date,
  patternId: row.pattern_id
});

// GET all shifts
router.get('/', (req, res) => {
  const { month } = req.query;
  let rows: ShiftRow[];
  if (month && typeof month === 'string') {
    rows = db.prepare('SELECT * FROM shifts WHERE date LIKE ? ORDER BY date').all(`${month}%`) as ShiftRow[];
  } else {
    rows = db.prepare('SELECT * FROM shifts ORDER BY date').all() as ShiftRow[];
  }
  res.json(rows.map(toShift));
});

// GET shifts by staff ID
router.get('/staff/:staffId', (req, res) => {
  const rows = db.prepare('SELECT * FROM shifts WHERE staff_id = ? ORDER BY date').all(req.params.staffId) as ShiftRow[];
  res.json(rows.map(toShift));
});

// POST create shift
router.post('/', (req, res) => {
  const id = uuidv4();
  const { staffId, date, patternId } = req.body;

  try {
    db.prepare(`
      INSERT INTO shifts (id, staff_id, date, pattern_id) VALUES (?, ?, ?, ?)
    `).run(id, staffId, date, patternId);

    const row = db.prepare('SELECT * FROM shifts WHERE id = ?').get(id) as ShiftRow;
    res.status(201).json(toShift(row));
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('UNIQUE constraint')) {
      // Update existing shift
      db.prepare('UPDATE shifts SET pattern_id = ? WHERE staff_id = ? AND date = ?')
        .run(patternId, staffId, date);
      const row = db.prepare('SELECT * FROM shifts WHERE staff_id = ? AND date = ?').get(staffId, date) as ShiftRow;
      res.json(toShift(row));
    } else {
      throw e;
    }
  }
});

// PUT update shift
router.put('/:id', (req, res) => {
  const { patternId } = req.body;
  const result = db.prepare('UPDATE shifts SET pattern_id = ? WHERE id = ?').run(patternId, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Shift not found' });

  const row = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id) as ShiftRow;
  res.json(toShift(row));
});

// DELETE shift
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM shifts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Shift not found' });
  res.status(204).send();
});

// POST bulk create/update shifts
router.post('/bulk', (req, res) => {
  const { items } = req.body;
  const insert = db.prepare(`
    INSERT OR REPLACE INTO shifts (id, staff_id, date, pattern_id)
    VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction((items: Array<{ id?: string; staffId: string; date: string; patternId: string }>) => {
    for (const item of items) {
      insert.run(item.id || uuidv4(), item.staffId, item.date, item.patternId);
    }
  });

  transaction(items);
  res.json({ success: true, count: items.length });
});

// POST auto-generate shifts for a month
router.post('/auto-generate', (req, res) => {
  const { month, clearExisting } = req.body;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: '月の形式が正しくありません (YYYY-MM)' });
  }

  // Clear existing shifts if requested
  if (clearExisting) {
    clearShifts(month);
  }

  // Generate shifts
  const result = generateShifts(month);

  if (result.success) {
    res.json({
      success: true,
      message: `${result.shiftsGenerated}件のシフトを生成しました`,
      shiftsGenerated: result.shiftsGenerated,
      warnings: result.warnings
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'シフト生成に失敗しました',
      errors: result.errors,
      warnings: result.warnings
    });
  }
});

// DELETE clear shifts for a month
router.delete('/month/:month', (req, res) => {
  const { month } = req.params;

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: '月の形式が正しくありません (YYYY-MM)' });
  }

  const deleted = clearShifts(month);
  res.json({ success: true, deleted });
});

export default router;
