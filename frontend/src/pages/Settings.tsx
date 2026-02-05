import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBilling } from '../contexts/BillingContext';
import './Settings.css';

function Settings() {
  const { user } = useAuth();
  const { billingStatus, isLoading, createCheckoutSession, createPortalSession } = useBilling();
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [processingPortal, setProcessingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setProcessingCheckout(true);
    setError(null);
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : '決済ページへの移動に失敗しました');
      setProcessingCheckout(false);
    }
  };

  const handleManageBilling = async () => {
    setProcessingPortal(true);
    setError(null);
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : '課金管理ページへの移動に失敗しました');
      setProcessingPortal(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; className: string }> = {
      TRIALING: { text: 'トライアル中', className: 'status-trialing' },
      ACTIVE: { text: '有効', className: 'status-active' },
      CANCELED: { text: 'キャンセル済み', className: 'status-canceled' },
      PAST_DUE: { text: '支払い遅延', className: 'status-past-due' },
      UNPAID: { text: '未払い', className: 'status-unpaid' },
      NONE: { text: '未契約', className: 'status-none' }
    };
    return labels[status] || { text: status, className: '' };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="loading">読み込み中...</div>;
  }

  const statusInfo = billingStatus ? getStatusLabel(billingStatus.status) : { text: '-', className: '' };
  const showUpgradeButton = billingStatus && (billingStatus.status === 'TRIALING' || billingStatus.status === 'NONE' || billingStatus.status === 'CANCELED');
  const showManageButton = billingStatus && billingStatus.hasSubscription;

  return (
    <div className="settings">
      <div className="page-header">
        <h1 className="page-title">設定</h1>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="settings-grid">
        <div className="settings-card">
          <h2 className="card-title">アカウント情報</h2>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">名前</span>
              <span className="info-value">{user?.name || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">メールアドレス</span>
              <span className="info-value">{user?.email || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">権限</span>
              <span className="info-value">{user?.role === 'admin' ? '管理者' : 'スタッフ'}</span>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2 className="card-title">契約情報</h2>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">ステータス</span>
              <span className={`info-value subscription-status ${statusInfo.className}`}>
                {statusInfo.text}
              </span>
            </div>
            {billingStatus?.status === 'TRIALING' && billingStatus.trialDaysRemaining !== null && (
              <div className="info-item">
                <span className="info-label">トライアル残り</span>
                <span className="info-value">{billingStatus.trialDaysRemaining}日</span>
              </div>
            )}
            {billingStatus?.trialEndsAt && billingStatus.status === 'TRIALING' && (
              <div className="info-item">
                <span className="info-label">トライアル終了日</span>
                <span className="info-value">{formatDate(billingStatus.trialEndsAt)}</span>
              </div>
            )}
            {billingStatus?.currentPeriodEnd && billingStatus.status === 'ACTIVE' && (
              <div className="info-item">
                <span className="info-label">次回更新日</span>
                <span className="info-value">{formatDate(billingStatus.currentPeriodEnd)}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">プラン</span>
              <span className="info-value">スタンダード（¥9,800/月）</span>
            </div>
          </div>

          <div className="billing-actions">
            {showUpgradeButton && (
              <button
                className="btn btn-primary"
                onClick={handleSubscribe}
                disabled={processingCheckout}
              >
                {processingCheckout ? '処理中...' : '有料プランに申し込む'}
              </button>
            )}
            {showManageButton && (
              <button
                className="btn btn-secondary"
                onClick={handleManageBilling}
                disabled={processingPortal}
              >
                {processingPortal ? '処理中...' : '支払い方法・契約を管理'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
