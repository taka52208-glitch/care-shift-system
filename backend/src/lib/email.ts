import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'CareShift <noreply@careshift.jp>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * 登録完了メールを送信
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string,
  tenantName: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not set, skipping welcome email');
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '【CareShift】ご登録ありがとうございます',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">CareShiftへようこそ</h1>
          <p>${userName} 様</p>
          <p>「${tenantName}」のアカウント登録が完了しました。</p>
          <p>14日間の無料トライアル期間中は、すべての機能をご利用いただけます。</p>
          <div style="margin: 30px 0;">
            <a href="${FRONTEND_URL}/login"
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              ログインする
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            ご不明な点がございましたら、お気軽にお問い合わせください。<br>
            CareShift サポートチーム
          </p>
        </div>
      `,
    });
    console.log(`[Email] Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * パスワードリセットメールを送信
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not set, skipping password reset email');
    return { success: true };
  }

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '【CareShift】パスワードリセットのご案内',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">パスワードリセット</h1>
          <p>パスワードリセットのリクエストを受け付けました。</p>
          <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              パスワードをリセット
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            このリンクは1時間有効です。<br>
            心当たりがない場合は、このメールを無視してください。
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            CareShift サポートチーム
          </p>
        </div>
      `,
    });
    console.log(`[Email] Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 決済完了メールを送信
 */
export async function sendPaymentSuccessEmail(
  email: string,
  tenantName: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not set, skipping payment success email');
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '【CareShift】有料プランへのご登録ありがとうございます',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">有料プラン登録完了</h1>
          <p>「${tenantName}」の有料プランへのご登録が完了しました。</p>
          <p>引き続きCareShiftをご利用ください。</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>プラン:</strong> スタンダード</p>
            <p style="margin: 10px 0 0;"><strong>料金:</strong> ¥9,800/月（税込）</p>
          </div>
          <div style="margin: 30px 0;">
            <a href="${FRONTEND_URL}/app/settings"
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              契約情報を確認
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            CareShift サポートチーム
          </p>
        </div>
      `,
    });
    console.log(`[Email] Payment success email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send payment success email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 支払い失敗メールを送信
 */
export async function sendPaymentFailedEmail(
  email: string,
  tenantName: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not set, skipping payment failed email');
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '【CareShift】お支払いに問題が発生しました',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">お支払いの問題</h1>
          <p>「${tenantName}」のお支払い処理に問題が発生しました。</p>
          <p>お支払い方法を確認し、更新をお願いします。</p>
          <div style="margin: 30px 0;">
            <a href="${FRONTEND_URL}/app/settings"
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              支払い方法を更新
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            7日以内にお支払いが確認できない場合、サービスが停止される可能性があります。
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            CareShift サポートチーム
          </p>
        </div>
      `,
    });
    console.log(`[Email] Payment failed email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send payment failed email:', error);
    return { success: false, error: String(error) };
  }
}
