import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import './Login.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://care-shift-system.onrender.com/api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <span className="login-logo">⚠️</span>
            <h1>無効なリンク</h1>
            <p>
              このパスワードリセットリンクは無効です。<br />
              再度パスワードリセットをリクエストしてください。
            </p>
          </div>
          <div className="login-hint">
            <Link to="/forgot-password">パスワードリセットをリクエスト</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'エラーが発生しました');
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <span className="login-logo">✅</span>
            <h1>パスワードを更新しました</h1>
            <p>
              新しいパスワードでログインできます。<br />
              ログインページにリダイレクトします...
            </p>
          </div>
          <div className="login-hint">
            <Link to="/login">今すぐログイン</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/login" className="login-back">
          ← ログインに戻る
        </Link>
        <div className="login-header">
          <span className="login-logo">🔐</span>
          <h1>新しいパスワードを設定</h1>
          <p>新しいパスワードを入力してください。</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password">新しいパスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="6文字以上"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">パスワード（確認）</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="もう一度入力"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '更新中...' : 'パスワードを更新'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
