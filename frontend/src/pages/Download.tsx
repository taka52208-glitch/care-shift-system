import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import './Download.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://care-shift-system.onrender.com'

function Download() {
  const [formData, setFormData] = useState({
    facilityName: '',
    email: '',
    facilityType: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // リード情報をバックエンドに送信
      await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityName: formData.facilityName,
          email: formData.email,
          facilityType: formData.facilityType,
          source: 'excel-template-download',
        }),
      })
    } catch {
      // リード保存失敗してもDLは許可する
    }

    setIsLoading(false)
    setIsSubmitted(true)
  }

  return (
    <div className="download-page">
      <Helmet>
        <title>介護シフト表Excelテンプレート無料ダウンロード | CareShift</title>
        <meta name="description" content="介護施設向けシフト表Excelテンプレートを無料ダウンロード。早番・日勤・遅番・夜勤対応、人員配置基準チェック欄付き。" />
      </Helmet>

      <nav className="download-nav">
        <div className="download-nav-container">
          <Link to="/" className="download-nav-logo">
            <span>🏥</span>
            <span>CareShift</span>
          </Link>
          <Link to="/blog" className="download-nav-link">お役立ちコラム</Link>
        </div>
      </nav>

      <main className="download-main">
        <div className="download-container">
          <h1 className="download-title">
            介護施設向け シフト表<br />
            Excelテンプレート（無料）
          </h1>
          <p className="download-description">
            早番・日勤・遅番・夜勤対応。人員配置基準チェック欄・夜勤回数集計付き。
          </p>

          <div className="download-features">
            <div className="download-feature">
              <span className="download-feature-icon">📅</span>
              <span>月間シフト表（31日対応）</span>
            </div>
            <div className="download-feature">
              <span className="download-feature-icon">🎨</span>
              <span>勤務区分の自動色分け</span>
            </div>
            <div className="download-feature">
              <span className="download-feature-icon">📊</span>
              <span>日別人員集計・夜勤回数集計</span>
            </div>
            <div className="download-feature">
              <span className="download-feature-icon">🛡️</span>
              <span>配置基準チェック欄付き</span>
            </div>
          </div>

          {!isSubmitted ? (
            <form className="download-form" onSubmit={handleSubmit}>
              <div className="download-form-group">
                <label htmlFor="facilityName">施設名</label>
                <input
                  type="text"
                  id="facilityName"
                  name="facilityName"
                  value={formData.facilityName}
                  onChange={handleChange}
                  placeholder="例：グループホーム○○"
                  required
                />
              </div>
              <div className="download-form-group">
                <label htmlFor="email">メールアドレス</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="例：info@example.com"
                  required
                />
              </div>
              <div className="download-form-group">
                <label htmlFor="facilityType">施設種別</label>
                <select
                  id="facilityType"
                  name="facilityType"
                  value={formData.facilityType}
                  onChange={handleChange}
                  required
                >
                  <option value="">選択してください</option>
                  <option value="グループホーム">グループホーム</option>
                  <option value="特別養護老人ホーム">特別養護老人ホーム</option>
                  <option value="有料老人ホーム">有料老人ホーム</option>
                  <option value="デイサービス">デイサービス</option>
                  <option value="老人保健施設">老人保健施設</option>
                  <option value="訪問介護">訪問介護</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              {error && <p className="download-error">{error}</p>}
              <button type="submit" className="download-submit" disabled={isLoading}>
                {isLoading ? 'ダウンロード準備中...' : '無料ダウンロード'}
              </button>
              <p className="download-note">
                入力いただいた情報はテンプレート配布およびCareShiftのご案内にのみ使用します。
              </p>
            </form>
          ) : (
            <div className="download-success">
              <div className="download-success-icon">✅</div>
              <h2>ダウンロードの準備ができました</h2>
              <a
                href="/templates/kaigo-shift-template.xlsx"
                download
                className="download-btn"
              >
                Excelテンプレートをダウンロード
              </a>
              <div className="download-cta">
                <p>
                  Excelの限界を感じたら、<strong>CareShift</strong>をお試しください。<br />
                  ボタン1つでシフト自動生成。ICT補助金で実質月額2,450円〜。
                </p>
                <Link to="/register" className="download-cta-btn">
                  14日間無料トライアルを始める
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Download
