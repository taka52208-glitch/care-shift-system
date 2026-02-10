import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { toStaffResponse } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

const router = Router();

// GET all staff
router.get('/', authMiddleware, async (req, res) => {
  try {
    const staffList = await prisma.staff.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { name: 'asc' }
    });
    res.json(staffList.map(toStaffResponse));
  } catch (error) {
    logger.error('Error fetching staff list', { error: String(error) });
    res.status(500).json({ error: 'スタッフ一覧の取得に失敗しました' });
  }
});

// GET staff by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! }
    });
    if (!staff) {
      return res.status(404).json({ error: 'スタッフが見つかりません' });
    }
    res.json(toStaffResponse(staff));
  } catch (error) {
    logger.error('Error fetching staff', { error: String(error) });
    res.status(500).json({ error: 'スタッフの取得に失敗しました' });
  }
});

// POST create staff
router.post('/', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, qualification, employmentType, phone, email } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '名前は必須です', code: 'VALIDATION_ERROR' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: '名前は100文字以内で入力してください', code: 'VALIDATION_ERROR' });
    }
    if (phone && typeof phone === 'string' && phone.length > 20) {
      return res.status(400).json({ error: '電話番号は20文字以内で入力してください', code: 'VALIDATION_ERROR' });
    }
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: '有効なメールアドレスを入力してください', code: 'VALIDATION_ERROR' });
      }
    }

    const staff = await prisma.staff.create({
      data: {
        name: name.trim(),
        qualification: qualification || null,
        employmentType: employmentType || null,
        phone: phone || null,
        email: email || null,
        tenantId: req.tenantId!,
      }
    });
    res.status(201).json(toStaffResponse(staff));
  } catch (error) {
    logger.error('Error creating staff', { error: String(error) });
    res.status(500).json({ error: 'スタッフの作成に失敗しました' });
  }
});

// PUT update staff
router.put('/:id', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, qualification, employmentType, phone, email } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({ error: '名前は必須です', code: 'VALIDATION_ERROR' });
    }
    if (name && name.length > 100) {
      return res.status(400).json({ error: '名前は100文字以内で入力してください', code: 'VALIDATION_ERROR' });
    }
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: '有効なメールアドレスを入力してください', code: 'VALIDATION_ERROR' });
      }
    }

    // Check if staff exists
    const existing = await prisma.staff.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! }
    });
    if (!existing) {
      return res.status(404).json({ error: 'スタッフが見つかりません' });
    }

    const staff = await prisma.staff.update({
      where: { id: req.params.id },
      data: {
        name: name ? name.trim() : existing.name,
        qualification: qualification || null,
        employmentType: employmentType || null,
        phone: phone || null,
        email: email || null,
      }
    });
    res.json(toStaffResponse(staff));
  } catch (error) {
    logger.error('Error updating staff', { error: String(error) });
    res.status(500).json({ error: 'スタッフの更新に失敗しました' });
  }
});

// DELETE staff
router.delete('/:id', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    // Check if staff exists
    const existing = await prisma.staff.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! }
    });
    if (!existing) {
      return res.status(404).json({ error: 'スタッフが見つかりません' });
    }

    await prisma.staff.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting staff', { error: String(error) });
    res.status(500).json({ error: 'スタッフの削除に失敗しました' });
  }
});

export default router;
