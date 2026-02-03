import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-icon">🏥</span>
            <span className="nav-logo-text">CareShift</span>
          </Link>
          <div className="nav-links">
            <Link to="/login" className="nav-link">ログイン</Link>
            <Link to="/register" className="btn btn-primary">無料で始める</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <h1 className="hero-title">
            介護施設の<br />
            シフト作成を<span className="highlight">自動化</span>
          </h1>
          <p className="hero-description">
            複雑な制約を考慮した最適なシフト表を自動生成。
            スタッフの希望休も反映し、公平で効率的なシフト管理を実現します。
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              14日間無料で試す
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              デモを見る
            </Link>
          </div>
          <p className="hero-note">クレジットカード不要 / いつでもキャンセル可能</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <h2 className="section-title">主な機能</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>自動シフト生成</h3>
              <p>
                日勤・夜勤の人数配置、連続勤務制限、有資格者配置など
                複雑な制約を満たすシフトを自動で作成
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🙋</div>
              <h3>希望休管理</h3>
              <p>
                スタッフからの希望休・出勤希望を受付。
                承認後は自動シフト生成に反映されます
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>スタッフ管理</h3>
              <p>
                資格、雇用形態を登録。
                条件に応じた適切な人員配置を実現
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>柔軟な制約設定</h3>
              <p>
                最低人数、連勤制限、夜勤回数など
                施設ごとの運用ルールに合わせて設定可能
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>レポート機能</h3>
              <p>
                月別の勤務時間集計、夜勤回数、休日数など
                必要なデータを一目で確認
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>安全なデータ管理</h3>
              <p>
                クラウド上で安全にデータを保管。
                複数端末からアクセス可能
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="pricing-container">
          <h2 className="section-title">料金プラン</h2>
          <p className="pricing-description">
            シンプルな料金体系。14日間の無料トライアル後、月額プランをお選びいただけます。
          </p>
          <div className="pricing-card">
            <div className="pricing-badge">人気プラン</div>
            <h3 className="pricing-name">スタンダードプラン</h3>
            <div className="pricing-price">
              <span className="price-amount">¥9,800</span>
              <span className="price-period">/月（税込）</span>
            </div>
            <ul className="pricing-features">
              <li>スタッフ数無制限</li>
              <li>自動シフト生成</li>
              <li>希望休管理</li>
              <li>レポート機能</li>
              <li>メールサポート</li>
            </ul>
            <Link to="/register" className="btn btn-primary btn-large btn-full">
              14日間無料で始める
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2>今すぐシフト管理を効率化</h2>
          <p>
            14日間の無料トライアルで、CareShiftの便利さを体験してください。
          </p>
          <Link to="/register" className="btn btn-primary btn-large">
            無料で始める
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-logo">
            <span className="nav-logo-icon">🏥</span>
            <span>CareShift</span>
          </div>
          <p className="footer-copyright">
            &copy; 2025 CareShift. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
