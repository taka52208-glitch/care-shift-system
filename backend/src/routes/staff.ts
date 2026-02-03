import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { toStaffResponse } from '../types/index.js';
import { prisma } from '../lib/prisma.js';

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
    console.error('Error fetching staff list:', error);
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
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'スタッフの取得に失敗しました' });
  }
});

// POST create staff
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, qualification, employmentType, phone, email } = req.body;
    const staff = await prisma.staff.create({
      data: {
        name,
        qualification: qualification || null,
        employmentType: employmentType || null,
        phone: phone || null,
        email: email || null,
        tenantId: req.tenantId!,
      }
    });
    res.status(201).json(toStaffResponse(staff));
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'スタッフの作成に失敗しました' });
  }
});

// PUT update staff
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, qualification, employmentType, phone, email } = req.body;

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
        name,
        qualification: qualification || null,
        employmentType: employmentType || null,
        phone: phone || null,
        email: email || null,
      }
    });
    res.json(toStaffResponse(staff));
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'スタッフの更新に失敗しました' });
  }
});

// DELETE staff
router.delete('/:id', authMiddleware, async (req, res) => {
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
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'スタッフの削除に失敗しました' });
  }
});

export default router;
