import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shift-system-secret-key-2024';

interface UserRow {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: string;
}

// POST login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

  if (!user) {
    return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// GET current user
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; role: string };
    res.json({
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    });
  } catch {
    res.status(401).json({ error: 'トークンが無効です' });
  }
});

export default router;
