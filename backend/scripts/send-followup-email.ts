/**
 * フォローアップメール送信スクリプト
 *
 * 使い方:
 * npx tsx scripts/send-followup-email.ts <メールアドレス> <施設名>
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'CareShift <taka52208@gmail.com>';
const FRONTEND_URL = 'https://care-shift-system.vercel.app';

async function sendFollowupEmail(toEmail: string, facilityName: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Error] RESEND_API_KEY not set');
    process.exit(1);
  }

  const subject = '【事例紹介】シフト作成10時間→30分に短縮した方法';

  const html = `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.8;">
      <p>${facilityName} ご担当者様</p>

      <p>先日ご案内いたしました、介護施設向けシフト管理システム「CareShift」です。<br>
      お忙しいところ恐れ入ります。</p>

      <p>本日は、<strong>実際にシフト作成業務がどう変わるのか</strong>を具体的にお伝えしたく、ご連絡いたしました。</p>

      <div style="background: #fefce8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #eab308;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #854d0e;">■ Before → After</p>
        <table style="width: 100%; color: #475569; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0;">シフト作成時間</td>
            <td style="padding: 4px 0;"><strong>10時間以上 → 約30分</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">連勤・夜勤ルール違反</td>
            <td style="padding: 4px 0;"><strong>月2〜3件 → 0件（自動チェック）</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">スタッフの希望反映率</td>
            <td style="padding: 4px 0;"><strong>約60% → 95%以上</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">シフト表の作り直し</td>
            <td style="padding: 4px 0;"><strong>月2〜3回 → ほぼ0回</strong></td>
          </tr>
        </table>
      </div>

      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #166534;">■ 3ステップで完了</p>
        <p style="margin: 0; color: #475569;">
          <strong>①</strong> スタッフと勤務パターンを登録（初回のみ・約15分）<br>
          <strong>②</strong> 「自動生成」ボタンをクリック<br>
          <strong>③</strong> 生成されたシフトを確認・微調整 → 完成
        </p>
      </div>

      <p style="font-size: 15px;">
        <strong>14日間、すべての機能を無料</strong>でお試しいただけます。<br>
        クレジットカードの登録も不要ですので、お気軽にお試しください。
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/register"
           style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          無料で試してみる（14日間）
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px;">
        ※ ご不要の場合は、お手数ですがこのメールへ「配信停止」とご返信ください。<br>
        　 今後のご連絡を控えさせていただきます。
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

      <div style="color: #64748b; font-size: 14px;">
        <p style="margin: 0;">
          CareShift - 介護施設向けシフト管理システム<br>
          ${FRONTEND_URL}<br>
          お問い合わせ: taka52208@gmail.com
        </p>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: subject,
      html: html,
    });

    console.log(`[Success] Followup sent to ${toEmail}`);
    console.log('Message ID:', result.data?.id);
    return true;
  } catch (error) {
    console.error('[Error] Failed:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('使い方: npx tsx scripts/send-followup-email.ts <メールアドレス> <施設名>');
    process.exit(1);
  }

  const [email, facilityName] = args;

  console.log(`\n=== フォローアップメール送信 ===`);
  console.log(`宛先: ${email}`);
  console.log(`施設名: ${facilityName}`);
  console.log(`================================\n`);

  const success = await sendFollowupEmail(email, facilityName);
  console.log(success ? '\n✅ 送信完了' : '\n❌ 送信失敗');
  if (!success) process.exit(1);
}

main();
