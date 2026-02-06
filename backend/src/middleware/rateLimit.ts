import rateLimit from 'express-rate-limit';

/**
 * 認証エンドポイント用レート制限
 * ブルートフォース攻撃対策
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 10, // 15分間に10回まで
  message: {
    error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * パスワードリセット用レート制限
 * より厳しい制限
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 5, // 1時間に5回まで
  message: {
    error: 'パスワードリセットのリクエストが多すぎます。1時間後に再度お試しください。',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API全体用レート制限
 * 一般的なDoS対策
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 100, // 1分間に100回まで
  message: {
    error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Webhook は除外
    return req.path.startsWith('/api/webhook');
  },
});

/**
 * 登録エンドポイント用レート制限
 * スパム登録対策
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 5, // 1時間に5回まで（同一IPから）
  message: {
    error: '登録リクエストが多すぎます。しばらく待ってから再度お試しください。',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
