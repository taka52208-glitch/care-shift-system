import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://care-shift-system.onrender.com/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
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

  if (sent) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <span className="login-logo">📧</span>
            <h1>メールを送信しました</h1>
            <p>
              パスワードリセットのリンクをメールで送信しました。<br />
              メールをご確認ください。
            </p>
          </div>
          <div className="login-hint">
            <Link to="/login">ログインページに戻る</Link>
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
          <span className="login-logo">🔑</span>
          <h1>パスワードをお忘れですか？</h1>
          <p>
            登録したメールアドレスを入力してください。<br />
            パスワードリセットのリンクをお送りします。
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@company.com"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '送信中...' : 'リセットリンクを送信'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
