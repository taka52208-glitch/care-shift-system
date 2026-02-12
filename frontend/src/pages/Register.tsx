import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    tenantName: '',
    userName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateSubdomain = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `cs-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.passwordConfirm) {
      setError('パスワードが一致しません')
      return
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }

    setIsLoading(true)

    try {
      await register({
        tenantName: formData.tenantName,
        subdomain: generateSubdomain(),
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
      })
      navigate('/app/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <Link to="/" className="register-back">
          ← トップに戻る
        </Link>
        <div className="register-header">
          <span className="register-logo">🏥</span>
          <h1>CareShiftに登録</h1>
          <p>14日間の無料トライアルを開始</p>
        </div>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-section">
            <h3>事業所情報</h3>
            <div className="form-group">
              <label htmlFor="tenantName">事業所名 *</label>
              <input
                type="text"
                id="tenantName"
                name="tenantName"
                value={formData.tenantName}
                onChange={handleChange}
                placeholder="例: ケアホームさくら"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>管理者アカウント</h3>
            <div className="form-group">
              <label htmlFor="userName">お名前 *</label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                placeholder="山田 太郎"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">メールアドレス *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">パスワード *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="6文字以上"
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="passwordConfirm">パスワード確認 *</label>
                <input
                  type="password"
                  id="passwordConfirm"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  placeholder="再入力"
                  required
                />
              </div>
            </div>
          </div>

          <div className="register-terms">
            <p>
              登録することで、
              <a href="/terms" target="_blank">利用規約</a>
              および
              <a href="/privacy" target="_blank">プライバシーポリシー</a>
              に同意したものとみなされます。
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-large"
            disabled={isLoading}
          >
            {isLoading ? '登録中...' : '無料トライアルを開始'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            既にアカウントをお持ちですか？{' '}
            <Link to="/login">ログイン</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
