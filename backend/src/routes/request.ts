import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';

const router = Router();

interface RequestRow {
  id: string;
  staff_id: string;
  staff_name: string;
  date: string;
  request_type: string;
  reason: string | null;
  status: string;
  created_at: string;
}

const toRequest = (row: RequestRow) => ({
  id: row.id,
  staffId: row.staff_id,
  staffName: row.staff_name,
  date: row.date,
  requestType: row.request_type,
  reason: row.reason,
  status: row.status,
  createdAt: row.created_at
});

// GET all requests
router.get('/', (req, res) => {
  const { status, month } = req.query;
  let sql = 'SELECT * FROM requests WHERE 1=1';
  const params: string[] = [];

  if (status && typeof status === 'string') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (month && typeof month === 'string') {
    sql += ' AND date LIKE ?';
    params.push(`${month}%`);
  }
  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params) as RequestRow[];
  res.json(rows.map(toRequest));
});

// GET request by ID
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id) as RequestRow | undefined;
  if (!row) return res.status(404).json({ error: 'Request not found' });
  res.json(toRequest(row));
});

// POST create request
router.post('/', (req, res) => {
  const id = uuidv4();
  const { staffId, staffName, date, requestType, reason } = req.body;

  db.prepare(`
    INSERT INTO requests (id, staff_id, staff_name, date, request_type, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, staffId, staffName, date, requestType, reason || null);

  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as RequestRow;
  res.status(201).json(toRequest(row));
});

// PUT update request status
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const result = db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Request not found' });

  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id) as RequestRow;
  res.json(toRequest(row));
});

// DELETE request
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM requests WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Request not found' });
  res.status(204).send();
});

export default router;
