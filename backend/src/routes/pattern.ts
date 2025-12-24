import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';

const router = Router();

interface PatternRow {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  break_time: number;
  color: string;
}

const toPattern = (row: PatternRow) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  startTime: row.start_time,
  endTime: row.end_time,
  breakTime: row.break_time,
  color: row.color
});

// GET all patterns
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM patterns ORDER BY id').all() as PatternRow[];
  res.json(rows.map(toPattern));
});

// GET pattern by ID
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM patterns WHERE id = ?').get(req.params.id) as PatternRow | undefined;
  if (!row) return res.status(404).json({ error: 'Pattern not found' });
  res.json(toPattern(row));
});

// POST create pattern
router.post('/', (req, res) => {
  const id = uuidv4();
  const { name, code, startTime, endTime, breakTime, color } = req.body;

  db.prepare(`
    INSERT INTO patterns (id, name, code, start_time, end_time, break_time, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, code, startTime, endTime, breakTime, color);

  const row = db.prepare('SELECT * FROM patterns WHERE id = ?').get(id) as PatternRow;
  res.status(201).json(toPattern(row));
});

// PUT update pattern
router.put('/:id', (req, res) => {
  const { name, code, startTime, endTime, breakTime, color } = req.body;
  const result = db.prepare(`
    UPDATE patterns SET name = ?, code = ?, start_time = ?, end_time = ?, break_time = ?, color = ?
    WHERE id = ?
  `).run(name, code, startTime, endTime, breakTime, color, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Pattern not found' });

  const row = db.prepare('SELECT * FROM patterns WHERE id = ?').get(req.params.id) as PatternRow;
  res.json(toPattern(row));
});

// DELETE pattern
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM patterns WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Pattern not found' });
  res.status(204).send();
});

export default router;
