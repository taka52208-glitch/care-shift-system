import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';

const router = Router();

interface StaffRow {
  id: string;
  name: string;
  qualification: string;
  employment_type: string;
  phone: string;
  email: string | null;
  created_at: string;
}

const toStaff = (row: StaffRow) => ({
  id: row.id,
  name: row.name,
  qualification: row.qualification,
  employmentType: row.employment_type,
  phone: row.phone,
  email: row.email,
  createdAt: row.created_at
});

// GET all staff
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM staff ORDER BY name').all() as StaffRow[];
  res.json(rows.map(toStaff));
});

// GET staff by ID
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id) as StaffRow | undefined;
  if (!row) return res.status(404).json({ error: 'Staff not found' });
  res.json(toStaff(row));
});

// POST create staff
router.post('/', (req, res) => {
  const id = uuidv4();
  const { name, qualification, employmentType, phone, email } = req.body;
  db.prepare(`
    INSERT INTO staff (id, name, qualification, employment_type, phone, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, qualification, employmentType, phone, email || null);

  const row = db.prepare('SELECT * FROM staff WHERE id = ?').get(id) as StaffRow;
  res.status(201).json(toStaff(row));
});

// PUT update staff
router.put('/:id', (req, res) => {
  const { name, qualification, employmentType, phone, email } = req.body;
  const result = db.prepare(`
    UPDATE staff SET name = ?, qualification = ?, employment_type = ?, phone = ?, email = ?
    WHERE id = ?
  `).run(name, qualification, employmentType, phone, email || null, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Staff not found' });

  const row = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id) as StaffRow;
  res.json(toStaff(row));
});

// DELETE staff
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Staff not found' });
  res.status(204).send();
});

export default router;
