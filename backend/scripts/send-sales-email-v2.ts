/**
 * 営業メール送信スクリプト v2（改訂版）
 *
 * 改善ポイント:
 * - 件名: 「無料」ではなく「課題解決」にフォーカス
 * - 施設名パーソナライズ強化
 * - ICT補助金訴求を追加
 * - 「スタッフ数無制限」差別化を明示
 * - CTA: トライアル + 資料請求の2段階
 *
 * 使い方:
 * npx tsx scripts/send-sales-email-v2.ts <メールアドレス> <施設名>
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

async function sendSalesEmailV2(
  toEmail: string,
  facilityName: string
): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Error] RESEND_API_KEY not set');
    return { success: false, error: 'RESEND_API_KEY not set' };
  }

  const subject = `${facilityName}様｜介護シフト作成の時間を80%削減する方法`;

  const html = `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.8; color: #334155;">

      <p>${facilityName}<br>施設長様（ご担当者様）</p>

      <p>突然のご連絡、失礼いたします。<br>
      介護施設専門のシフト管理システム「CareShift」の担当です。</p>

      <p>毎月のシフト作成、こんなお悩みはございませんか？</p>

      <div style="background: #fef2f2; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <ul style="margin: 0; padding-left: 18px; color: #991b1b;">
          <li>シフト作成に毎月<strong>10時間以上</strong>かかっている</li>
          <li>夜勤の偏りでスタッフから<strong>不満の声</strong>がある</li>
          <li>配置基準違反を<strong>見落としそうで不安</strong></li>
          <li>担当者が休むと<strong>シフトが作れない</strong></li>
        </ul>
      </div>

      <p>CareShiftは<strong>介護施設専門</strong>に開発されたシフト自動生成システムです。<br>
      早番・日勤・遅番・夜勤の配置、連勤制限、希望休をすべて考慮し、<br>
      <strong>ボタン1つで最適なシフト表を自動作成</strong>します。</p>

      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
        <p style="margin: 0 0 12px; font-weight: bold; color: #166534;">CareShiftの特長</p>
        <table style="width: 100%; color: #334155; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; border-bottom: 1px solid #dcfce7;">⏱ シフト作成時間</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #dcfce7; font-weight: bold;">最大80%削減</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; border-bottom: 1px solid #dcfce7;">🛡 人員配置基準</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #dcfce7; font-weight: bold;">自動チェックで違反ゼロ</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; border-bottom: 1px solid #dcfce7;">⚖ 夜勤・休日</td>
            <td style="padding: 6px 0; border-bottom: 1px solid #dcfce7; font-weight: bold;">公平に自動分配</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">💰 料金</td>
            <td style="padding: 6px 0; font-weight: bold; color: #2563eb;">月額9,800円（スタッフ数無制限）</td>
          </tr>
        </table>
      </div>

      <div style="background: #eff6ff; padding: 16px 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e40af;">
          <strong>💡 ICT補助金のご活用について</strong><br>
          <span style="font-size: 14px;">
            介護ICT導入支援事業の対象として、補助率1/2〜3/4で導入費用を大幅に軽減できる場合がございます。
            申請方法もサポートいたします。
          </span>
        </p>
      </div>

      <p><strong>14日間すべての機能を無料</strong>でお試しいただけます。<br>
      クレジットカード不要・初期費用0円で、導入サポートも無料です。</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/register"
           style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          14日間無料で試す
        </a>
        <br>
        <a href="${FRONTEND_URL}#demo"
           style="display: inline-block; margin-top: 12px; color: #2563eb; text-decoration: underline; font-size: 14px;">
          まずは画面イメージを見る →
        </a>
      </div>

      <p style="font-size: 14px; color: #64748b;">
        ご質問やデモのご希望がございましたら、このメールにご返信ください。<br>
        オンラインで15分ほどご説明することも可能です。
      </p>

      <p style="color: #64748b; font-size: 13px;">
        ※ ご不要の場合は「配信停止」とご返信いただければ、今後のご連絡を控えます。
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

      <div style="color: #94a3b8; font-size: 13px;">
        <p style="margin: 0;">
          CareShift - 介護施設専門シフト管理システム<br>
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
    console.log('使い方: npx tsx scripts/send-sales-email-v2.ts <メールアドレス> <施設名>');
    console.log('例: npx tsx scripts/send-sales-email-v2.ts test@example.com "グループホームゆめゆめ"');
    process.exit(1);
  }

  const [email, facilityName] = args;

  console.log(`\n=== 営業メール送信 v2 ===`);
  console.log(`宛先: ${email}`);
  console.log(`施設名: ${facilityName}`);
  console.log(`========================\n`);

  const result = await sendSalesEmailV2(email, facilityName);

  if (result.success) {
    console.log('\n✅ 送信完了');
  } else {
    console.log('\n❌ 送信失敗:', result.error);
    process.exit(1);
  }
}

main();
