import { Link } from 'react-router-dom';
import './BillingResult.css';

function BillingCancel() {
  return (
    <div className="billing-result">
      <div className="result-card cancel">
        <div className="result-icon">×</div>
        <h1 className="result-title">お申し込みがキャンセルされました</h1>
        <p className="result-message">
          決済処理がキャンセルされました。<br />
          引き続きトライアル期間中は無料でご利用いただけます。
        </p>
        <div className="result-actions">
          <Link to="/app/dashboard" className="btn btn-primary">
            ダッシュボードへ
          </Link>
          <Link to="/app/settings" className="btn btn-secondary">
            設定ページへ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BillingCancel;
