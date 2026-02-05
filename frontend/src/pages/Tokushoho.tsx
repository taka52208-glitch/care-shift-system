import { Link } from 'react-router-dom'
import './Legal.css'

function Tokushoho() {
  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">🏥</span>
          <span className="nav-logo-text">CareShift</span>
        </Link>
      </nav>

      <div className="legal-content">
        <h1>特定商取引法に基づく表記</h1>
        <p className="legal-updated">最終更新日: 2026年2月5日</p>

        <table className="tokushoho-table">
          <tbody>
            <tr>
              <th>販売事業者名</th>
              <td>酒井 貴幹</td>
            </tr>
            <tr>
              <th>運営責任者</th>
              <td>酒井 貴幹</td>
            </tr>
            <tr>
              <th>所在地</th>
              <td>〒491-0084<br />愛知県一宮市古見町11-1</td>
            </tr>
            <tr>
              <th>電話番号</th>
              <td>080-6050-3408<br />※お問い合わせはメールでお願いします</td>
            </tr>
            <tr>
              <th>メールアドレス</th>
              <td>taka52208@gmail.com</td>
            </tr>
            <tr>
              <th>サービス名</th>
              <td>CareShift（ケアシフト）</td>
            </tr>
            <tr>
              <th>サービス内容</th>
              <td>介護施設向けシフト管理クラウドサービス</td>
            </tr>
            <tr>
              <th>販売価格</th>
              <td>月額 9,800円（税込）</td>
            </tr>
            <tr>
              <th>支払方法</th>
              <td>クレジットカード（Visa、Mastercard、American Express、JCB）</td>
            </tr>
            <tr>
              <th>支払時期</th>
              <td>サブスクリプション登録時および毎月の更新日</td>
            </tr>
            <tr>
              <th>サービス提供時期</th>
              <td>登録完了後、即時利用可能<br />14日間の無料トライアル期間あり</td>
            </tr>
            <tr>
              <th>返品・キャンセル</th>
              <td>
                デジタルサービスの性質上、利用開始後の返金はお受けできません。<br />
                サブスクリプションはいつでもキャンセル可能です。キャンセル後も請求期間終了まで利用できます。
              </td>
            </tr>
            <tr>
              <th>動作環境</th>
              <td>
                対応ブラウザ: Google Chrome、Firefox、Safari、Microsoft Edge（最新版）<br />
                インターネット接続が必要です
              </td>
            </tr>
            <tr>
              <th>その他</th>
              <td>
                表示価格は税込です。<br />
                サービス内容は予告なく変更する場合があります。
              </td>
            </tr>
          </tbody>
        </table>

        <div className="legal-footer">
          <Link to="/">トップページに戻る</Link>
        </div>
      </div>
    </div>
  )
}

export default Tokushoho
