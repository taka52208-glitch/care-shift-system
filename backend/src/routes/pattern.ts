import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { toShiftPatternResponse } from '../types/index.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET all patterns
router.get('/', async (req: Request, res: Response) => {
  try {
    const patterns = await prisma.shiftPattern.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { code: 'asc' },
    });
    res.json(patterns.map(toShiftPatternResponse));
  } catch (error) {
    logger.error('Get patterns error', { error: String(error) });
    res.status(500).json({
      error: 'シフトパターンの取得中にエラーが発生しました',
      code: 'GET_PATTERNS_ERROR',
    });
  }
});

// GET pattern by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pattern = await prisma.shiftPattern.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });

    if (!pattern) {
      return res.status(404).json({
        error: 'シフトパターンが見つかりません',
        code: 'PATTERN_NOT_FOUND',
      });
    }

    res.json(toShiftPatternResponse(pattern));
  } catch (error) {
    logger.error('Get pattern error', { error: String(error) });
    res.status(500).json({
      error: 'シフトパターンの取得中にエラーが発生しました',
      code: 'GET_PATTERN_ERROR',
    });
  }
});

// POST create pattern
router.post('/', requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, code, startTime, endTime, breakTime, color } = req.body;

    // Validation
    if (!name || !code || !startTime || !endTime) {
      return res.status(400).json({
        error: '名前、コード、開始時間、終了時間は必須です',
        code: 'VALIDATION_ERROR',
      });
    }

    if (typeof name !== 'string' || name.length > 50) {
      return res.status(400).json({
        error: 'パターン名は50文字以内で入力してください',
        code: 'VALIDATION_ERROR',
      });
    }

    if (typeof code !== 'string' || code.length > 5) {
      return res.status(400).json({
        error: 'コードは5文字以内で入力してください',
        code: 'VALIDATION_ERROR',
      });
    }

    const timeRegex = /^(\d{2}:\d{2}|-)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        error: '時間の形式が正しくありません (HH:MM)',
        code: 'VALIDATION_ERROR',
      });
    }

    if (breakTime !== undefined && (typeof breakTime !== 'number' || breakTime < 0 || breakTime > 480)) {
      return res.status(400).json({
        error: '休憩時間は0〜480分の範囲で入力してください',
        code: 'VALIDATION_ERROR',
      });
    }

    if (color && (typeof color !== 'string' || color.length > 20)) {
      return res.status(400).json({
        error: 'カラーの形式が正しくありません',
        code: 'VALIDATION_ERROR',
      });
    }

    // Check for duplicate code within tenant
    const existingPattern = await prisma.shiftPattern.findFirst({
      where: { code, tenantId: req.tenantId! },
    });

    if (existingPattern) {
      return res.status(409).json({
        error: 'このコードは既に使用されています',
        code: 'DUPLICATE_CODE',
      });
    }

    const pattern = await prisma.shiftPattern.create({
      data: {
        tenantId: req.tenantId!,
        name: name.trim(),
        code: code.trim(),
        startTime,
        endTime,
        breakTime: breakTime || 0,
        color: color || '#6b7280',
      },
    });

    res.status(201).json(toShiftPatternResponse(pattern));
  } catch (error) {
    logger.error('Create pattern error', { error: String(error) });
    res.status(500).json({
      error: 'シフトパターンの作成中にエラーが発生しました',
      code: 'CREATE_PATTERN_ERROR',
    });
  }
});

// PUT update pattern
router.put('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, code, startTime, endTime, breakTime, color } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.length > 50)) {
      return res.status(400).json({
        error: 'パターン名は50文字以内で入力してください',
        code: 'VALIDATION_ERROR',
      });
    }

    if (code !== undefined && (typeof code !== 'string' || code.length > 5)) {
      return res.status(400).json({
        error: 'コードは5文字以内で入力してください',
        code: 'VALIDATION_ERROR',
      });
    }

    // Check if pattern exists and belongs to tenant
    const existingPattern = await prisma.shiftPattern.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });

    if (!existingPattern) {
      return res.status(404).json({
        error: 'シフトパターンが見つかりません',
        code: 'PATTERN_NOT_FOUND',
      });
    }

    // Check for duplicate code if code is being changed
    if (code && code !== existingPattern.code) {
      const duplicateCode = await prisma.shiftPattern.findFirst({
        where: { code, tenantId: req.tenantId! },
      });

      if (duplicateCode) {
        return res.status(409).json({
          error: 'このコードは既に使用されています',
          code: 'DUPLICATE_CODE',
        });
      }
    }

    const pattern = await prisma.shiftPattern.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existingPattern.name,
        code: code ?? existingPattern.code,
        startTime: startTime ?? existingPattern.startTime,
        endTime: endTime ?? existingPattern.endTime,
        breakTime: breakTime ?? existingPattern.breakTime,
        color: color ?? existingPattern.color,
      },
    });

    res.json(toShiftPatternResponse(pattern));
  } catch (error) {
    logger.error('Update pattern error', { error: String(error) });
    res.status(500).json({
      error: 'シフトパターンの更新中にエラーが発生しました',
      code: 'UPDATE_PATTERN_ERROR',
    });
  }
});

// DELETE pattern
router.delete('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    // Check if pattern exists and belongs to tenant
    const existingPattern = await prisma.shiftPattern.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });

    if (!existingPattern) {
      return res.status(404).json({
        error: 'シフトパターンが見つかりません',
        code: 'PATTERN_NOT_FOUND',
      });
    }

    // Check if pattern is used in any shifts
    const shiftsUsingPattern = await prisma.shift.count({
      where: {
        patternId: req.params.id,
        tenantId: req.tenantId!,
      },
    });

    if (shiftsUsingPattern > 0) {
      return res.status(409).json({
        error: 'このパターンは使用中のシフトがあるため削除できません',
        code: 'PATTERN_IN_USE',
      });
    }

    await prisma.shiftPattern.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Delete pattern error', { error: String(error) });
    res.status(500).json({
      error: 'シフトパターンの削除中にエラーが発生しました',
      code: 'DELETE_PATTERN_ERROR',
    });
  }
});

export default router;
