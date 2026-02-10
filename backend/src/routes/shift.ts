import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { toShiftResponse } from '../types/index.js';
import { generateShifts, clearShifts } from '../services/shiftGenerator.js';
import { logger } from '../lib/logger.js';

const router = Router();

// GET all shifts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { month } = req.query;

    const shifts = await prisma.shift.findMany({
      where: month && typeof month === 'string'
        ? { tenantId: req.tenantId!, date: { startsWith: month } }
        : { tenantId: req.tenantId! },
      orderBy: { date: 'asc' }
    });

    res.json(shifts.map(toShiftResponse));
  } catch (error) {
    logger.error('Error fetching shifts', { error: String(error) });
    res.status(500).json({ error: 'シフト一覧の取得に失敗しました' });
  }
});

// GET shifts by staff ID
router.get('/staff/:staffId', authMiddleware, async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { tenantId: req.tenantId!, staffId: req.params.staffId },
      orderBy: { date: 'asc' }
    });

    res.json(shifts.map(toShiftResponse));
  } catch (error) {
    logger.error('Error fetching staff shifts', { error: String(error) });
    res.status(500).json({ error: 'スタッフのシフト取得に失敗しました' });
  }
});

// POST create shift
router.post('/', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { staffId, date, patternId } = req.body;

    if (!staffId || !date || !patternId) {
      return res.status(400).json({ error: 'スタッフID、日付、パターンIDは必須です', code: 'VALIDATION_ERROR' });
    }

    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: '日付の形式が正しくありません (YYYY-MM-DD)', code: 'VALIDATION_ERROR' });
    }

    // Check if shift already exists for this staff on this date
    const existing = await prisma.shift.findFirst({
      where: { tenantId: req.tenantId!, staffId, date }
    });

    if (existing) {
      // Update existing shift
      const shift = await prisma.shift.update({
        where: { id: existing.id },
        data: { patternId }
      });
      return res.json(toShiftResponse(shift));
    }

    // Create new shift
    const shift = await prisma.shift.create({
      data: {
        staffId,
        date,
        patternId,
        tenantId: req.tenantId!
      }
    });

    res.status(201).json(toShiftResponse(shift));
  } catch (error) {
    logger.error('Error creating shift', { error: String(error) });
    res.status(500).json({ error: 'シフトの作成に失敗しました' });
  }
});

// PUT update shift
router.put('/:id', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { patternId } = req.body;

    // Check if shift exists
    const existing = await prisma.shift.findFirst({
      where: { tenantId: req.tenantId!, id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'シフトが見つかりません' });
    }

    const shift = await prisma.shift.update({
      where: { id: req.params.id },
      data: { patternId }
    });

    res.json(toShiftResponse(shift));
  } catch (error) {
    logger.error('Error updating shift', { error: String(error) });
    res.status(500).json({ error: 'シフトの更新に失敗しました' });
  }
});

// DELETE shift
router.delete('/:id', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    // Check if shift exists
    const existing = await prisma.shift.findFirst({
      where: { tenantId: req.tenantId!, id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'シフトが見つかりません' });
    }

    await prisma.shift.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting shift', { error: String(error) });
    res.status(500).json({ error: 'シフトの削除に失敗しました' });
  }
});

// POST bulk create/update shifts
router.post('/bulk', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { items } = req.body;
    const tenantId = req.tenantId!;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items配列が必要です', code: 'VALIDATION_ERROR' });
    }

    if (items.length > 500) {
      return res.status(400).json({ error: '一度に500件まで処理できます', code: 'VALIDATION_ERROR' });
    }

    // Use transaction for bulk operations
    await prisma.$transaction(async (tx) => {
      for (const item of items as Array<{ id?: string; staffId: string; date: string; patternId: string }>) {
        // Use upsert to handle both create and update
        await tx.shift.upsert({
          where: {
            tenantId_staffId_date: {
              tenantId,
              staffId: item.staffId,
              date: item.date
            }
          },
          update: { patternId: item.patternId },
          create: {
            tenantId,
            staffId: item.staffId,
            date: item.date,
            patternId: item.patternId
          }
        });
      }
    });

    res.json({ success: true, count: items.length });
  } catch (error) {
    logger.error('Error bulk creating shifts', { error: String(error) });
    res.status(500).json({ error: 'シフトの一括作成に失敗しました' });
  }
});

// POST auto-generate shifts for a month
router.post('/auto-generate', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { month, clearExisting } = req.body;
    const tenantId = req.tenantId!;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: '月の形式が正しくありません (YYYY-MM)' });
    }

    // Clear existing shifts if requested
    if (clearExisting) {
      await clearShifts(tenantId, month);
    }

    // Generate shifts
    const result = await generateShifts(tenantId, month);

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
  } catch (error) {
    logger.error('Error auto-generating shifts', { error: String(error) });
    res.status(500).json({ error: 'シフトの自動生成に失敗しました' });
  }
});

// DELETE clear shifts for a month
router.delete('/month/:month', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { month } = req.params;
    const tenantId = req.tenantId!;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: '月の形式が正しくありません (YYYY-MM)' });
    }

    const deleted = await clearShifts(tenantId, month);
    res.json({ success: true, deleted });
  } catch (error) {
    logger.error('Error clearing shifts', { error: String(error) });
    res.status(500).json({ error: 'シフトの削除に失敗しました' });
  }
});

export default router;
