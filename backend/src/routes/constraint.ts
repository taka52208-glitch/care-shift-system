import { Router } from 'express';
import { db } from '../config/database.js';

const router = Router();

interface ConstraintRow {
  id: string;
  category: string;
  key: string;
  value: string;
}

const toConstraint = (row: ConstraintRow) => ({
  id: row.id,
  category: row.category,
  key: row.key,
  value: isNaN(Number(row.value)) ? row.value === 'true' : Number(row.value)
});

// GET all constraints
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM constraints ORDER BY category, key').all() as ConstraintRow[];
  res.json(rows.map(toConstraint));
});

// GET constraints by category
router.get('/category/:category', (req, res) => {
  const rows = db.prepare('SELECT * FROM constraints WHERE category = ?').all(req.params.category) as ConstraintRow[];
  res.json(rows.map(toConstraint));
});

// PUT update constraint
router.put('/:id', (req, res) => {
  const { value } = req.body;
  const result = db.prepare('UPDATE constraints SET value = ? WHERE id = ?').run(String(value), req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Constraint not found' });

  const row = db.prepare('SELECT * FROM constraints WHERE id = ?').get(req.params.id) as ConstraintRow;
  res.json(toConstraint(row));
});

// PUT bulk update constraints
router.put('/', (req, res) => {
  const { items } = req.body;
  const update = db.prepare('UPDATE constraints SET value = ? WHERE id = ?');

  const transaction = db.transaction((items: Array<{ id: string; value: number | boolean }>) => {
    for (const item of items) {
      update.run(String(item.value), item.id);
    }
  });

  transaction(items);

  const rows = db.prepare('SELECT * FROM constraints ORDER BY category, key').all() as ConstraintRow[];
  res.json(rows.map(toConstraint));
});

export default router;
