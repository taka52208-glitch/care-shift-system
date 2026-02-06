/**
 * 営業メール送信スクリプト
 *
 * 使い方:
 * npx ts-node scripts/send-sales-email.ts <メールアドレス> <施設名>
 *
 * 例:
 * npx ts-node scripts/send-sales-email.ts gh.yumeyumw@gmail.com "グループホームゆめゆめ"
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'CareShift <taka52208@gmail.com>';
const FRONTEND_URL = 'https://care-shift-system.vercel.app';

interface SendResult {
  success: boolean;
  error?: string;
}

async function sendSalesEmail(
  toEmail: string,
  facilityName: string
): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Error] RESEND_API_KEY not set');
    return { success: false, error: 'RESEND_API_KEY not set' };
  }

  const subject = '【14日間無料】介護シフト作成を自動化しませんか？';

  const html = `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.8;">
      <p>突然のご連絡失礼いたします。<br>
      介護施設向けシフト管理システム「CareShift」と申します。</p>

      <p>貴施設では、毎月のシフト作成にどのくらいの時間をかけていらっしゃいますか？</p>

      <p>多くの施設様から<br>
      「毎月10時間以上かかる」<br>
      「スタッフの希望調整が大変」<br>
      「連勤や夜勤のルールを守るのが難しい」<br>
      というお声をいただいております。</p>

      <p><strong>CareShift</strong>は、これらの課題を自動化で解決します。</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #1e293b;">■ 主な機能</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569;">
          <li>日勤/夜勤の人数配置を考慮した自動生成</li>
          <li>スタッフの希望休を反映</li>
          <li>連続勤務・夜勤回数の制限チェック</li>
          <li>有資格者の配置管理</li>
        </ul>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #1e40af;">■ 料金</p>
        <p style="margin: 0; color: #1e40af;">
          月額 <strong style="font-size: 1.2em;">9,800円</strong>（税込）<br>
          <span style="color: #059669;">※14日間の無料トライアルあり</span><br>
          <span style="color: #059669;">※クレジットカード不要で開始可能</span>
        </p>
      </div>

      <p>まずは無料でお試しいただき、効果を実感していただければ幸いです。</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/register"
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          14日間無料で試す
        </a>
      </div>

      <p>ご不明点がございましたら、お気軽にご返信ください。</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

      <div style="color: #64748b; font-size: 14px;">
        <p style="margin: 0;">
          CareShift - 介護施設向けシフト管理システム<br>
          ${FRONTEND_URL}
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

    console.log(`[Success] Email sent to ${toEmail}`);
    console.log('Message ID:', result.data?.id);
    return { success: true };
  } catch (error) {
    console.error('[Error] Failed to send email:', error);
    return { success: false, error: String(error) };
  }
}

// メイン実行
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('使い方: npx ts-node scripts/send-sales-email.ts <メールアドレス> <施設名>');
    console.log('例: npx ts-node scripts/send-sales-email.ts test@example.com "グループホームゆめゆめ"');
    process.exit(1);
  }

  const [email, facilityName] = args;

  console.log(`\n=== 営業メール送信 ===`);
  console.log(`宛先: ${email}`);
  console.log(`施設名: ${facilityName}`);
  console.log(`========================\n`);

  const result = await sendSalesEmail(email, facilityName);

  if (result.success) {
    console.log('\n✅ 送信完了');
  } else {
    console.log('\n❌ 送信失敗:', result.error);
    process.exit(1);
  }
}

main();
