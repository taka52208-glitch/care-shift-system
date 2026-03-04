import { Router, Request, Response } from 'express';
import { appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../lib/logger.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.post('/', (req: Request, res: Response) => {
  const { facilityName, email, facilityType, source } = req.body;

  if (!facilityName || !email) {
    res.status(400).json({ error: '施設名とメールアドレスは必須です' });
    return;
  }

  const lead = {
    facilityName,
    email,
    facilityType: facilityType || '',
    source: source || 'unknown',
    createdAt: new Date().toISOString(),
  };

  logger.info('New lead captured', lead);

  // CSVファイルにも追記（バックアップ）
  try {
    const csvPath = join(__dirname, '../../leads.csv');
    const line = `${lead.createdAt},${lead.facilityName},${lead.email},${lead.facilityType},${lead.source}\n`;
    appendFileSync(csvPath, line, 'utf-8');
  } catch (err) {
    logger.error('Failed to write lead to CSV', { error: (err as Error).message });
  }

  res.json({ success: true });
});

export default router;
