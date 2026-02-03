import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { toConstraintResponse } from '../types/index.js';

const router = Router();

// GET all constraints
router.get('/', authMiddleware, async (req, res) => {
  try {
    const constraints = await prisma.constraint.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
    res.json(constraints.map(toConstraintResponse));
  } catch (error) {
    console.error('Error fetching constraints:', error);
    res.status(500).json({ error: '制約の取得に失敗しました' });
  }
});

// GET constraints by category
router.get('/category/:category', authMiddleware, async (req, res) => {
  try {
    const constraints = await prisma.constraint.findMany({
      where: { tenantId: req.tenantId!, category: req.params.category },
      orderBy: { key: 'asc' },
    });
    res.json(constraints.map(toConstraintResponse));
  } catch (error) {
    console.error('Error fetching constraints by category:', error);
    res.status(500).json({ error: '制約の取得に失敗しました' });
  }
});

// PUT update constraint by ID
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { value } = req.body;
    const { id } = req.params;

    // Verify the constraint belongs to the tenant
    const existing = await prisma.constraint.findFirst({
      where: { id, tenantId: req.tenantId! },
    });

    if (!existing) {
      return res.status(404).json({ error: '制約が見つかりません' });
    }

    const updated = await prisma.constraint.update({
      where: { id },
      data: { value: String(value) },
    });

    res.json(toConstraintResponse(updated));
  } catch (error) {
    console.error('Error updating constraint:', error);
    res.status(500).json({ error: '制約の更新に失敗しました' });
  }
});

// PUT bulk update constraints (upsert)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body as {
      items: Array<{ id?: string; category: string; key: string; value: number | boolean | string }>;
    };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items配列が必要です' });
    }

    const tenantId = req.tenantId!;

    // Use transaction for bulk upsert
    await prisma.$transaction(
      items.map((item) =>
        prisma.constraint.upsert({
          where: {
            tenantId_category_key: {
              tenantId,
              category: item.category,
              key: item.key,
            },
          },
          update: {
            value: String(item.value),
          },
          create: {
            tenantId,
            category: item.category,
            key: item.key,
            value: String(item.value),
          },
        })
      )
    );

    // Fetch all constraints for response
    const constraints = await prisma.constraint.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    res.json(constraints.map(toConstraintResponse));
  } catch (error) {
    console.error('Error bulk updating constraints:', error);
    res.status(500).json({ error: '制約の一括更新に失敗しました' });
  }
});

export default router;
