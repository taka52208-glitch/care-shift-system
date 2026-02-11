import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

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
            <Link to="/blog" className="nav-link">お役立ちコラム</Link>
            <Link to="/login" className="nav-link">ログイン</Link>
            <Link to="/register" className="btn btn-primary">14日間無料で試す</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <p className="hero-pain">毎月のシフト作成、まだExcelで消耗していませんか？</p>
          <h1 className="hero-title">
            介護シフト作成を<br />
            <span className="highlight">10時間 → 30分</span>に
          </h1>
          <p className="hero-description">
            人員配置基準・夜勤回数・希望休をすべて考慮した最適シフトを自動生成。<br />
            スタッフ数無制限で<span className="hero-strong">月額9,800円</span>。
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              14日間無料で試す
            </Link>
            <a href="#demo" className="btn btn-outline btn-large">
              画面を見る
            </a>
          </div>
          <p className="hero-note">クレジットカード不要 / 初期費用0円 / いつでもキャンセル可能</p>

          {/* Hero Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">80%</span>
              <span className="hero-stat-label">シフト作成時間削減</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">0件</span>
              <span className="hero-stat-label">配置基準違反</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">95%</span>
              <span className="hero-stat-label">希望休反映率</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo / Screenshot Section */}
      <section className="demo" id="demo">
        <div className="demo-container">
          <h2 className="section-title">CareShiftの画面イメージ</h2>
          <p className="demo-description">
            直感的な操作で、複雑なシフト表を簡単に作成できます
          </p>
          <div className="demo-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="mockup-title">CareShift - シフト管理</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="mockup-menu-item active">シフト表</div>
                <div className="mockup-menu-item">スタッフ管理</div>
                <div className="mockup-menu-item">希望休</div>
                <div className="mockup-menu-item">レポート</div>
              </div>
              <div className="mockup-content">
                <div className="mockup-toolbar">
                  <span className="mockup-month">2026年2月</span>
                  <span className="mockup-generate-btn">自動生成</span>
                </div>
                <table className="mockup-table">
                  <thead>
                    <tr>
                      <th>スタッフ</th>
                      <th>月</th>
                      <th>火</th>
                      <th>水</th>
                      <th>木</th>
                      <th>金</th>
                      <th className="weekend">土</th>
                      <th className="weekend">日</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="staff-name">田中 花子</td>
                      <td><span className="shift-tag day">日勤</span></td>
                      <td><span className="shift-tag day">日勤</span></td>
                      <td><span className="shift-tag off">休</span></td>
                      <td><span className="shift-tag early">早番</span></td>
                      <td><span className="shift-tag day">日勤</span></td>
                      <td><span className="shift-tag off">休</span></td>
                      <td><span className="shift-tag night">夜勤</span></td>
                    </tr>
                    <tr>
                      <td className="staff-name">佐藤 太郎</td>
                      <td><span className="shift-tag early">早番</span></td>
                      <td><span className="shift-tag off">休</span></td>
                      <td><span className="shift-tag night">夜勤</span></td>
                      <td><span className="shift-tag off">明休</span></td>
                      <td><span className="shift-tag early">早番</span></td>
                      <td><span className="shift-tag day">日勤</span></td>
                      <td><span className="shift-tag off">休</span></td>
                    </tr>
                    <tr>
                      <td className="staff-name">鈴木 美咲</td>
                      <td><span className="shift-tag off">休</span></td>
                      <td><span className="shift-tag late">遅番</span></td>
                      <td><span className="shift-tag day">日勤</span></td>
                      <td><span className="shift-tag day">日勤</span></td>
                      <td><span className="shift-tag off">休</span></td>
                      <td><span className="shift-tag night">夜勤</span></td>
                      <td><span className="shift-tag off">明休</span></td>
                    </tr>
                    <tr>
                      <td className="staff-name">山田 健一</td>
                      <td><span className="shift-tag late">遅番</span></td>
                      <td><span className="shift-tag day">日勤</span></td>
                      <td><span className="shift-tag early">早番</span></td>
                      <td><span className="shift-tag off">休</span></td>
                      <td><span className="shift-tag late">遅番</span></td>
                      <td><span className="shift-tag early">早番</span></td>
                      <td><span className="shift-tag day">日勤</span></td>
                    </tr>
                  </tbody>
                </table>
                <div className="mockup-status">
                  <span className="status-ok">人員配置基準: OK</span>
                  <span className="status-ok">連勤制限: OK</span>
                  <span className="status-ok">夜勤回数: 均等</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="comparison">
        <div className="comparison-container">
          <h2 className="section-title">導入前 vs 導入後</h2>
          <div className="comparison-grid">
            <div className="comparison-card before">
              <div className="comparison-label">Before（Excel手作業）</div>
              <ul className="comparison-list">
                <li>
                  <span className="comparison-icon bad">✕</span>
                  シフト作成に毎月<strong>10時間以上</strong>
                </li>
                <li>
                  <span className="comparison-icon bad">✕</span>
                  連勤・配置基準違反を<strong>見落とし</strong>
                </li>
                <li>
                  <span className="comparison-icon bad">✕</span>
                  希望休を紙で回覧、<strong>反映漏れ</strong>
                </li>
                <li>
                  <span className="comparison-icon bad">✕</span>
                  夜勤の偏りで<strong>スタッフ不満</strong>
                </li>
                <li>
                  <span className="comparison-icon bad">✕</span>
                  担当者不在時に<strong>誰も作れない</strong>
                </li>
              </ul>
            </div>
            <div className="comparison-arrow">→</div>
            <div className="comparison-card after">
              <div className="comparison-label">After（CareShift）</div>
              <ul className="comparison-list">
                <li>
                  <span className="comparison-icon good">✓</span>
                  ワンクリックで<strong>約30分</strong>で完成
                </li>
                <li>
                  <span className="comparison-icon good">✓</span>
                  配置基準を<strong>自動チェック</strong>
                </li>
                <li>
                  <span className="comparison-icon good">✓</span>
                  希望休をオンラインで<strong>自動反映</strong>
                </li>
                <li>
                  <span className="comparison-icon good">✓</span>
                  夜勤回数を<strong>公平に自動分配</strong>
                </li>
                <li>
                  <span className="comparison-icon good">✓</span>
                  <strong>誰でも操作可能</strong>な簡単設計
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps">
        <div className="steps-container">
          <h2 className="section-title">かんたん3ステップで導入</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>無料登録</h3>
              <p>メールアドレスだけで登録完了。<br />クレジットカード不要です。</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>スタッフ情報を入力</h3>
              <p>スタッフと勤務パターンを登録。<br />初回のみ約15〜30分です。</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>自動生成ボタンを押すだけ</h3>
              <p>制約を満たしたシフト表を自動作成。<br />微調整して完成です。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (Benefits-focused) */}
      <section className="features">
        <div className="features-container">
          <h2 className="section-title">介護施設に特化した機能</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>月20時間の作業が30分に</h3>
              <p>
                早番・日勤・遅番・夜勤の人員配置、連続勤務制限、有資格者配置。
                すべての制約を考慮したシフトをワンクリックで自動生成します。
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🙋</div>
              <h3>紙の回覧が不要に</h3>
              <p>
                スタッフがスマホから希望休を提出。
                管理者が承認するだけで、自動生成に反映されます。
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h3>夜勤回数を公平に自動分配</h3>
              <p>
                「あの人ばかり夜勤が多い」を解消。
                スタッフ間の公平性を保ちながら最適なシフトを組みます。
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>人員配置基準を自動チェック</h3>
              <p>
                各時間帯の必要人員数を常にチェック。
                配置基準違反のリスクをゼロにします。
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>勤務実績を一目で把握</h3>
              <p>
                月別の勤務時間・夜勤回数・休日数を自動集計。
                常勤換算表の作成にも活用できます。
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>安心のクラウド管理</h3>
              <p>
                SSL暗号化通信でデータを安全に保管。
                PC・タブレット・スマホからいつでもアクセス可能です。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Social Proof Section */}
      <section className="trust">
        <div className="trust-container">
          <h2 className="section-title">選ばれる理由</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">💰</div>
              <div className="trust-content">
                <h3>ICT補助金で実質負担を大幅軽減</h3>
                <p>
                  介護ICT導入支援事業の対象ツールです。
                  補助率1/2〜3/4で、実質的な負担を大幅に軽減できる場合があります。
                  申請方法もサポートいたします。
                </p>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">♾️</div>
              <div className="trust-content">
                <h3>スタッフ数無制限で業界最安水準</h3>
                <p>
                  何名登録しても月額9,800円。スタッフ30名以上の施設なら、
                  1人あたり月額327円以下。従量課金の他社と比べて圧倒的にお得です。
                </p>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🎯</div>
              <div className="trust-content">
                <h3>介護施設専門だから余計な機能なし</h3>
                <p>
                  飲食・小売向けの汎用シフトツールとは違い、
                  早番・遅番・夜勤・明休など介護特有の勤務パターンに最初から対応しています。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="pricing-container">
          <h2 className="section-title">シンプルな料金プラン</h2>
          <p className="pricing-description">
            スタッフが何名でも同じ料金。規模が大きいほどお得です。
          </p>
          <div className="pricing-card">
            <div className="pricing-badge">14日間無料</div>
            <h3 className="pricing-name">スタンダードプラン</h3>
            <div className="pricing-price">
              <span className="price-amount">¥9,800</span>
              <span className="price-period">/月（税込）</span>
            </div>
            <div className="pricing-highlight">
              スタッフ数無制限 ― 30名なら1人あたり月327円
            </div>
            <ul className="pricing-features">
              <li>スタッフ登録数の上限なし</li>
              <li>自動シフト生成（回数無制限）</li>
              <li>希望休のオンライン管理</li>
              <li>人員配置基準の自動チェック</li>
              <li>勤務実績レポート</li>
              <li>メール・チャットサポート</li>
              <li>導入サポート無料</li>
            </ul>
            <Link to="/register" className="btn btn-primary btn-large btn-full">
              14日間無料で試す
            </Link>
            <p className="pricing-note">クレジットカード不要 / いつでもキャンセル可能</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="faq-container">
          <h2 className="section-title">よくあるご質問</h2>
          <div className="faq-list">
            {[
              {
                q: 'パソコンが苦手でも使えますか？',
                a: 'はい。操作はシンプルで、シフト自動生成はボタン1つです。導入時の初期設定もサポートいたしますのでご安心ください。'
              },
              {
                q: '今使っているExcelのデータは移行できますか？',
                a: 'スタッフ情報の初期登録は手動入力となりますが、15〜30分程度で完了します。今後CSV一括インポート機能も準備中です。'
              },
              {
                q: 'スタッフ全員がスマホを持っている必要がありますか？',
                a: 'いいえ。シフト作成は管理者のPC・タブレットだけで完結します。希望休提出機能をスタッフに使ってもらう場合のみ、各自のスマホがあると便利です。'
              },
              {
                q: '無料トライアル後、自動で課金されますか？',
                a: 'いいえ。14日間のトライアル中はクレジットカードの登録も不要です。継続をご希望の場合のみ、お支払い情報をご登録いただきます。'
              },
              {
                q: 'ICT補助金は使えますか？',
                a: '介護ICT導入支援事業の対象となる場合があります。補助率1/2〜3/4で導入費用を大幅に軽減できます。申請方法についてもサポートいたします。'
              },
              {
                q: '途中で解約できますか？',
                a: 'はい。解約はいつでも可能で、違約金もありません。月末までご利用いただけます。'
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`faq-item ${openFaq === index ? 'open' : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question">
                  <span>{item.q}</span>
                  <span className="faq-toggle">{openFaq === index ? '−' : '+'}</span>
                </div>
                {openFaq === index && (
                  <div className="faq-answer">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2>まずは14日間、無料でお試しください</h2>
          <p>
            初期費用0円・クレジットカード不要。<br />
            導入サポートも無料でお手伝いします。
          </p>
          <Link to="/register" className="btn btn-primary btn-large">
            14日間無料で試す
          </Link>
          <p className="cta-sub">ご不明な点はお気軽にお問い合わせください</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-logo">
            <span className="nav-logo-icon">🏥</span>
            <span>CareShift</span>
          </div>
          <div className="footer-links">
            <Link to="/terms">利用規約</Link>
            <Link to="/privacy">プライバシーポリシー</Link>
            <Link to="/tokushoho">特定商取引法に基づく表記</Link>
          </div>
          <p className="footer-copyright">
            &copy; 2026 CareShift. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
