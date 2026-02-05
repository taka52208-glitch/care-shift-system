import { Link } from 'react-router-dom'
import './Legal.css'

function Privacy() {
  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">🏥</span>
          <span className="nav-logo-text">CareShift</span>
        </Link>
      </nav>

      <div className="legal-content">
        <h1>プライバシーポリシー</h1>
        <p className="legal-updated">最終更新日: 2026年2月5日</p>

        <section>
          <h2>1. はじめに</h2>
          <p>CareShift（以下「当社」）は、お客様の個人情報の保護を重要な責務と考え、以下のプライバシーポリシーに従い、適切に個人情報を取り扱います。</p>
        </section>

        <section>
          <h2>2. 収集する情報</h2>
          <p>当社は、以下の情報を収集することがあります。</p>
          <ul>
            <li><strong>アカウント情報</strong>: 氏名、メールアドレス、電話番号、事業所名</li>
            <li><strong>支払い情報</strong>: クレジットカード情報（Stripeを通じて安全に処理）</li>
            <li><strong>利用データ</strong>: シフト情報、スタッフ情報、その他サービス利用に関するデータ</li>
            <li><strong>技術情報</strong>: IPアドレス、ブラウザ種別、アクセスログ</li>
          </ul>
        </section>

        <section>
          <h2>3. 情報の利用目的</h2>
          <p>収集した情報は、以下の目的で利用します。</p>
          <ul>
            <li>本サービスの提供・運営</li>
            <li>ユーザーサポートの提供</li>
            <li>サービスの改善・新機能の開発</li>
            <li>利用料金の請求</li>
            <li>重要なお知らせの送信</li>
            <li>不正利用の防止</li>
          </ul>
        </section>

        <section>
          <h2>4. 情報の第三者提供</h2>
          <p>当社は、以下の場合を除き、お客様の個人情報を第三者に提供しません。</p>
          <ul>
            <li>お客様の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>サービス提供に必要な業務委託先への提供（Stripe等の決済サービス）</li>
          </ul>
        </section>

        <section>
          <h2>5. 情報の保護</h2>
          <p>当社は、個人情報の漏洩、滅失、毀損を防止するため、適切なセキュリティ対策を講じます。</p>
          <ul>
            <li>SSL/TLSによる通信の暗号化</li>
            <li>パスワードのハッシュ化</li>
            <li>アクセス制限の実施</li>
            <li>定期的なセキュリティ監査</li>
          </ul>
        </section>

        <section>
          <h2>6. データの保存期間</h2>
          <p>当社は、サービス提供に必要な期間、お客様のデータを保存します。アカウント削除後は、法令で定められた期間を除き、速やかにデータを削除します。</p>
        </section>

        <section>
          <h2>7. お客様の権利</h2>
          <p>お客様は、以下の権利を有します。</p>
          <ul>
            <li>個人情報の開示請求</li>
            <li>個人情報の訂正・削除請求</li>
            <li>個人情報の利用停止請求</li>
          </ul>
          <p>これらの請求は、下記お問い合わせ先までご連絡ください。</p>
        </section>

        <section>
          <h2>8. Cookieの使用</h2>
          <p>当社は、サービスの利便性向上のためCookieを使用することがあります。Cookieの使用を望まない場合は、ブラウザの設定で無効にできます。</p>
        </section>

        <section>
          <h2>9. ポリシーの変更</h2>
          <p>当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、サービス上でお知らせします。</p>
        </section>

        <section>
          <h2>10. お問い合わせ</h2>
          <p>個人情報の取扱いに関するお問い合わせは、以下までご連絡ください。</p>
          <p>
            メール: taka52208@gmail.com<br />
            電話: 080-6050-3408
          </p>
        </section>

        <div className="legal-footer">
          <Link to="/">トップページに戻る</Link>
        </div>
      </div>
    </div>
  )
}

export default Privacy
