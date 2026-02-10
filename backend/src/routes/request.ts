import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { toShiftRequestResponse } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { RequestStatus } from '@prisma/client';

const router = Router();

// GET all requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, month } = req.query;

    const where: {
      tenantId: string;
      status?: RequestStatus;
      date?: { startsWith: string };
    } = { tenantId: req.tenantId! };

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase() as RequestStatus;
    }
    if (month && typeof month === 'string') {
      where.date = { startsWith: month };
    }

    const requests = await prisma.shiftRequest.findMany({
      where,
      include: { staff: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests.map(toShiftRequestResponse));
  } catch (error) {
    logger.error('Error fetching requests', { error: String(error) });
    res.status(500).json({ error: '希望シフト一覧の取得に失敗しました' });
  }
});

// GET request by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const request = await prisma.shiftRequest.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
      include: { staff: { select: { name: true } } }
    });

    if (!request) {
      return res.status(404).json({ error: '希望シフトが見つかりません' });
    }

    res.json(toShiftRequestResponse(request));
  } catch (error) {
    logger.error('Error fetching request', { error: String(error) });
    res.status(500).json({ error: '希望シフトの取得に失敗しました' });
  }
});

// POST create request
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { staffId, date, requestType, reason } = req.body;

    if (!staffId || !date || !requestType) {
      return res.status(400).json({ error: 'スタッフID、日付、希望種別は必須です', code: 'VALIDATION_ERROR' });
    }

    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: '日付の形式が正しくありません (YYYY-MM-DD)', code: 'VALIDATION_ERROR' });
    }

    if (typeof requestType !== 'string' || requestType.length > 50) {
      return res.status(400).json({ error: '希望種別は50文字以内で入力してください', code: 'VALIDATION_ERROR' });
    }

    if (reason && typeof reason === 'string' && reason.length > 500) {
      return res.status(400).json({ error: '理由は500文字以内で入力してください', code: 'VALIDATION_ERROR' });
    }

    // Validate staff exists
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, tenantId: req.tenantId! }
    });
    if (!staff) {
      return res.status(400).json({ error: '指定されたスタッフが見つかりません' });
    }

    const request = await prisma.shiftRequest.create({
      data: {
        staffId,
        date,
        requestType,
        reason: reason || null,
        status: RequestStatus.PENDING,
        tenantId: req.tenantId!
      }
    });

    // Fetch with staff name for response
    const requestWithStaff = await prisma.shiftRequest.findUnique({
      where: { id: request.id },
      include: { staff: { select: { name: true } } }
    });

    res.status(201).json(toShiftRequestResponse(requestWithStaff!));
  } catch (error) {
    logger.error('Error creating request', { error: String(error) });
    res.status(500).json({ error: '希望シフトの作成に失敗しました' });
  }
});

// PUT update request status
router.put('/:id/status', authMiddleware, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { status } = req.body;

    // Check if request exists
    const existing = await prisma.shiftRequest.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! }
    });
    if (!existing) {
      return res.status(404).json({ error: '希望シフトが見つかりません' });
    }

    // Convert status to enum
    const statusEnum = status.toUpperCase() as RequestStatus;
    if (!Object.values(RequestStatus).includes(statusEnum)) {
      return res.status(400).json({ error: '無効なステータスです' });
    }

    const request = await prisma.shiftRequest.update({
      where: { id: req.params.id },
      data: { status: statusEnum }
    });

    // Fetch with staff name for response
    const requestWithStaff = await prisma.shiftRequest.findUnique({
      where: { id: request.id },
      include: { staff: { select: { name: true } } }
    });

    res.json(toShiftRequestResponse(requestWithStaff!));
  } catch (error) {
    logger.error('Error updating request status', { error: String(error) });
    res.status(500).json({ error: '希望シフトのステータス更新に失敗しました' });
  }
});

// DELETE request
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if request exists
    const existing = await prisma.shiftRequest.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! }
    });
    if (!existing) {
      return res.status(404).json({ error: '希望シフトが見つかりません' });
    }

    await prisma.shiftRequest.delete({
      where: { id: existing.id }
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting request', { error: String(error) });
    res.status(500).json({ error: '希望シフトの削除に失敗しました' });
  }
});

export default router;
