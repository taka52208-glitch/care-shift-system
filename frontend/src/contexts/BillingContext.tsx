import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE } from '../utils/api';

interface BillingStatus {
  status: 'TRIALING' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'NONE';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
  trialDaysRemaining: number | null;
}

interface BillingContextType {
  billingStatus: BillingStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshBillingStatus: () => Promise<void>;
  createCheckoutSession: () => Promise<string>;
  createPortalSession: () => Promise<string>;
}

const BillingContext = createContext<BillingContextType | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBillingStatus = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/billing/status`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setBillingStatus(data);
      } else {
        const err = await res.json();
        setError(err.error || '課金情報の取得に失敗しました');
      }
    } catch {
      setError('課金情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshBillingStatus();
    }
  }, [user, refreshBillingStatus]);

  const createCheckoutSession = async (): Promise<string> => {
    if (!user) throw new Error('認証が必要です');

    const res = await fetch(`${API_BASE}/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'チェックアウトセッションの作成に失敗しました');
    }

    const data = await res.json();
    return data.url;
  };

  const createPortalSession = async (): Promise<string> => {
    if (!user) throw new Error('認証が必要です');

    const res = await fetch(`${API_BASE}/billing/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'ポータルセッションの作成に失敗しました');
    }

    const data = await res.json();
    return data.url;
  };

  return (
    <BillingContext.Provider value={{
      billingStatus,
      isLoading,
      error,
      refreshBillingStatus,
      createCheckoutSession,
      createPortalSession
    }}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
