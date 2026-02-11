/**
 * フォローアップメール送信スクリプト v2（改訂版）
 *
 * 改善ポイント:
 * - 件名: Q&A形式で好奇心を引く
 * - 根拠不明の数値を削除、Q&A形式に変更
 * - 導入のハードルの低さを具体的に説明
 * - 「施設長のよくある質問」で共感を作る
 * - デモ・相談の選択肢を提供
 *
 * 使い方:
 * npx tsx scripts/send-followup-email-v2.ts <メールアドレス> <施設名>
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'CareShift <taka52208@gmail.com>';
const FRONTEND_URL = 'https://care-shift-system.vercel.app';

async function sendFollowupEmailV2(toEmail: string, facilityName: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Error] RESEND_API_KEY not set');
    process.exit(1);
  }

  const subject = `${facilityName}様｜「パソコンが苦手でも使えますか？」への回答`;

  const html = `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.8; color: #334155;">

      <p>${facilityName}<br>施設長様（ご担当者様）</p>

      <p>先日、シフト管理システム「CareShift」をご案内いたしました。<br>
      お忙しい中、お目通しいただきありがとうございます。</p>

      <p>本日は、施設の方からよくいただく<strong>3つのご質問</strong>にお答えいたします。</p>

      <!-- Q&A Section -->
      <div style="margin: 25px 0;">

        <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #667eea;">Q. パソコンが苦手なスタッフでも使えますか？</p>
          <p style="margin: 0; font-size: 14px;">
            はい。シフト自動生成は<strong>ボタン1つ</strong>で完了します。<br>
            スタッフの方はスマホから希望休を出すだけ。難しい操作はありません。<br>
            導入時の初期設定も無料でサポートいたします。
          </p>
        </div>

        <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #667eea;">Q. 導入にどのくらい時間がかかりますか？</p>
          <p style="margin: 0; font-size: 14px;">
            初回のスタッフ情報・勤務パターンの登録に<strong>約15〜30分</strong>。<br>
            その後は毎月「自動生成」ボタンを押すだけです。<br>
            今のExcelを見ながら入力するだけなので、特別な準備は不要です。
          </p>
        </div>

        <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #667eea;">Q. 月額9,800円は少し高いのですが…</p>
          <p style="margin: 0; font-size: 14px;">
            CareShiftは<strong>スタッフ数無制限</strong>の定額制です。<br>
            30名の施設なら1人あたり月額わずか327円。<br>
            従量課金の他社サービスと比べて、規模が大きいほどお得です。<br><br>
            さらに、<strong style="color: #2563eb;">介護ICT導入支援事業の補助金</strong>（補助率1/2〜3/4）を<br>
            活用すれば実質負担を大幅に軽減できます。申請もサポートいたします。
          </p>
        </div>

      </div>

      <div style="background: #fefce8; padding: 16px 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #eab308;">
        <p style="margin: 0; color: #854d0e;">
          <strong>📌 14日間の無料トライアルについて</strong><br>
          <span style="font-size: 14px;">
            ・クレジットカードの登録は不要です<br>
            ・トライアル後に自動課金されることはありません<br>
            ・すべての機能をお試しいただけます<br>
            ・導入サポートも無料で対応いたします
          </span>
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/register"
           style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          14日間無料で試す
        </a>
        <p style="margin: 12px 0 0; font-size: 14px; color: #64748b;">
          または、このメールにご返信いただければ<br>
          <strong>15分のオンラインデモ</strong>をご用意いたします
        </p>
      </div>

      <p style="color: #64748b; font-size: 13px;">
        ※ ご不要の場合は「配信停止」とご返信ください。今後のご連絡を控えます。
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

    console.log(`[Success] Followup v2 sent to ${toEmail}`);
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
    console.log('使い方: npx tsx scripts/send-followup-email-v2.ts <メールアドレス> <施設名>');
    process.exit(1);
  }

  const [email, facilityName] = args;

  console.log(`\n=== フォローアップメール v2 送信 ===`);
  console.log(`宛先: ${email}`);
  console.log(`施設名: ${facilityName}`);
  console.log(`====================================\n`);

  const success = await sendFollowupEmailV2(email, facilityName);
  console.log(success ? '\n✅ 送信完了' : '\n❌ 送信失敗');
  if (!success) process.exit(1);
}

main();
