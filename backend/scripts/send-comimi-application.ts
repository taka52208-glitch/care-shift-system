/**
 * 介護のコミミ掲載申請メール送信
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'CareShift <taka52208@gmail.com>';

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Error] RESEND_API_KEY not set');
    process.exit(1);
  }

  const subject = 'CareShift（介護施設向けシフト管理システム）の掲載について';

  const html = `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.8; color: #334155;">

      <p>株式会社GiverLink<br>介護のコミミ ご担当者様</p>

      <p>突然のご連絡失礼いたします。<br>
      介護施設専門のシフト管理システム「CareShift」を運営しております。</p>

      <p>貴サイト「介護のコミミ」への製品掲載をご相談させていただきたく、<br>
      ご連絡いたしました。</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #1e293b;">■ サービス概要</p>
        <table style="color: #475569; font-size: 14px;">
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">サービス名</td><td>CareShift（ケアシフト）</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">URL</td><td><a href="https://care-shift-system.vercel.app">https://care-shift-system.vercel.app</a></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">カテゴリ</td><td>シフト管理・勤務表作成</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">対象</td><td>介護施設（特養・老健・GH・デイサービス等）</td></tr>
        </table>
      </div>

      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #166534;">■ 主な機能</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
          <li>早番/日勤/遅番/夜勤を考慮したシフト自動生成</li>
          <li>人員配置基準の自動チェック</li>
          <li>夜勤回数・休日の公平な自動分配</li>
          <li>スタッフの希望休オンライン管理</li>
          <li>勤務実績レポート</li>
        </ul>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #1e40af;">■ 料金</p>
        <p style="margin: 0; color: #475569; font-size: 14px;">
          月額 <strong>9,800円</strong>（税込）/ スタッフ数無制限<br>
          14日間無料トライアル（クレジットカード不要）
        </p>
      </div>

      <p>掲載に必要な情報や手続きがございましたら、<br>
      お知らせいただけますと幸いです。</p>

      <p>何卒よろしくお願いいたします。</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

      <div style="color: #94a3b8; font-size: 13px;">
        <p style="margin: 0;">
          CareShift - 介護施設専門シフト管理システム<br>
          https://care-shift-system.vercel.app<br>
          お問い合わせ: taka52208@gmail.com
        </p>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'y-sugihara@giver.page',
      subject: subject,
      html: html,
    });

    console.log('[Success] 介護のコミミ掲載申請メール送信完了');
    console.log('Message ID:', result.data?.id);
  } catch (error) {
    console.error('[Error] 送信失敗:', error);
    process.exit(1);
  }
}

main();
