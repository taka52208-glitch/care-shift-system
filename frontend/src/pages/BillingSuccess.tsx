import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBilling } from '../contexts/BillingContext';
import './BillingResult.css';

function BillingSuccess() {
  const { refreshBillingStatus } = useBilling();

  useEffect(() => {
    // 決済完了後に課金状態を更新
    refreshBillingStatus();
  }, [refreshBillingStatus]);

  return (
    <div className="billing-result">
      <div className="result-card success">
        <div className="result-icon">✓</div>
        <h1 className="result-title">お申し込みありがとうございます</h1>
        <p className="result-message">
          有料プランへの登録が完了しました。<br />
          すべての機能をご利用いただけます。
        </p>
        <div className="result-actions">
          <Link to="/app/dashboard" className="btn btn-primary">
            ダッシュボードへ
          </Link>
          <Link to="/app/settings" className="btn btn-secondary">
            契約情報を確認
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BillingSuccess;
