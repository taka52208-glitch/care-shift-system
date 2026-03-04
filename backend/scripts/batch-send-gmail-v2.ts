/**
 * Gmail SMTP バッチ送信スクリプト（v2 改善版フォローアップ）
 *
 * 改善点:
 * - 件名パーソナライズ（施設名入り）
 * - 送信者名を個人名に
 * - ICT補助金訴求に変更
 * - 短く・具体的な本文
 * - フォローアップシーケンス対応（step 1/2/3）
 *
 * 使い方:
 * npx tsx scripts/batch-send-gmail-v2.ts 0 0 1       # ドライラン step1
 * npx tsx scripts/batch-send-gmail-v2.ts 0 278 1     # 全件送信 step1（初回）
 * npx tsx scripts/batch-send-gmail-v2.ts 0 278 2     # 全件送信 step2（3日後）
 * npx tsx scripts/batch-send-gmail-v2.ts 0 278 3     # 全件送信 step3（10日後）
 */
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'taka52208@gmail.com',
    pass: 'ttycflfxtbbswfpy',
  },
});

interface Facility {
  name: string;
  email: string;
}

const facilitiesPath = join(__dirname, 'facilities.json');
const facilities: Facility[] = JSON.parse(readFileSync(facilitiesPath, 'utf-8'));

const FRONTEND_URL = 'https://care-shift-system.vercel.app';
const SENDER_NAME = '田中（CareShift）';
const SENDER_EMAIL = 'taka52208@gmail.com';

function getSubject(facilityName: string, step: number): string {
  switch (step) {
    case 1:
      return `${facilityName}様 — ICT補助金でシフト管理システムが実質月額2,450円に`;
    case 2:
      return `${facilityName}様 — シフト作成時間を月10時間→30分に短縮した方法`;
    case 3:
      return `${facilityName}様 — 最後のご案内（介護シフト自動作成）`;
    default:
      return `${facilityName}様 — シフト作成のご案内`;
  }
}

function buildStep1Html(facilityName: string): string {
  return `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.9; color: #333;">
      <p>${facilityName}<br>ご担当者様</p>

      <p>突然のご連絡失礼いたします。<br>
      介護施設向けシフト管理システム CareShift の田中と申します。</p>

      <p>1点だけお伝えしたいことがあります。</p>

      <p><strong>介護ICT導入支援事業（補助率 最大3/4）</strong>を活用すると、<br>
      シフト管理システムを<strong style="color: #059669;">実質 月額2,450円</strong>で導入できます。</p>

      <p>当システムでは、人員配置基準・夜勤回数・希望休をすべて考慮した<br>
      シフト表をボタン1つで自動生成できます。</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f0fdf4;">
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;"><strong>Excel手作業</strong></td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">→</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;"><strong>CareShift</strong></td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">月10時間以上</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">→</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #059669; font-weight: bold;">約30分</td>
        </tr>
      </table>

      <p>14日間の無料トライアル（クレジットカード不要）をご用意しています。<br>
      先着30施設様には<strong>導入サポートも無料</strong>で対応いたします。</p>

      <p style="margin: 25px 0;">
        <a href="${FRONTEND_URL}/register"
           style="color: #2563eb; font-weight: bold;">
          ▶ 無料でシフト表を作ってみる
        </a><br>
        <span style="font-size: 13px; color: #64748b;">${FRONTEND_URL}/register</span>
      </p>

      <p>ご不要でしたらスルーしていただいて構いません。<br>
      お忙しいところ失礼いたしました。</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">

      <div style="color: #64748b; font-size: 13px;">
        <p style="margin: 0;">
          田中 | CareShift（介護施設向けシフト自動作成システム）<br>
          ${FRONTEND_URL}<br>
          お問い合わせ: ${SENDER_EMAIL}
        </p>
      </div>

      <p style="color: #94a3b8; font-size: 11px; margin-top: 15px;">
        ※ ご不要の場合は「配信停止」とご返信ください。今後のご連絡を控えます。
      </p>
    </div>
  `;
}

function buildStep2Html(facilityName: string): string {
  return `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.9; color: #333;">
      <p>${facilityName}<br>ご担当者様</p>

      <p>先日ご連絡させていただいた CareShift の田中です。<br>
      1点だけ補足させてください。</p>

      <p>実際にCareShiftを使うと、こんな変化があります：</p>

      <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Before:</strong> 希望休を紙で回覧 → Excelに手入力 → 配置基準を目視チェック → 修正…</p>
        <p style="margin: 0;"><strong>After:</strong> 希望休はスマホで提出 → ボタン1つで自動生成 → 配置基準も自動チェック済み</p>
      </div>

      <p>月額9,800円（スタッフ数無制限）。<br>
      30名の施設なら<strong>1人あたり月327円</strong>です。</p>

      <p style="margin: 25px 0;">
        <a href="${FRONTEND_URL}/register"
           style="color: #2563eb; font-weight: bold;">
          ▶ 14日間 無料で試してみる
        </a><br>
        <span style="font-size: 13px; color: #64748b;">${FRONTEND_URL}/register</span>
      </p>

      <p>ご質問があればお気軽にご返信ください。</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">

      <div style="color: #64748b; font-size: 13px;">
        <p style="margin: 0;">
          田中 | CareShift（介護施設向けシフト自動作成システム）<br>
          ${FRONTEND_URL}<br>
          お問い合わせ: ${SENDER_EMAIL}
        </p>
      </div>

      <p style="color: #94a3b8; font-size: 11px; margin-top: 15px;">
        ※ ご不要の場合は「配信停止」とご返信ください。今後のご連絡を控えます。
      </p>
    </div>
  `;
}

function buildStep3Html(facilityName: string): string {
  return `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.9; color: #333;">
      <p>${facilityName}<br>ご担当者様</p>

      <p>CareShift の田中です。<br>
      度々のご連絡となり恐縮です。こちらが最後のご案内です。</p>

      <p>もし毎月のシフト作成で以下のお悩みがあれば、お力になれるかもしれません：</p>

      <ul style="color: #475569; padding-left: 20px;">
        <li>シフト作成に毎月8時間以上かかっている</li>
        <li>夜勤の偏りでスタッフから不満がある</li>
        <li>人員配置基準の違反が心配</li>
      </ul>

      <p>14日間の無料トライアル期間中に、<strong>導入初期設定を無料で代行</strong>いたします。<br>
      スタッフ情報をお伝えいただくだけで、すぐにお使いいただけます。</p>

      <p style="margin: 25px 0;">
        <a href="${FRONTEND_URL}/register"
           style="color: #2563eb; font-weight: bold;">
          ▶ 無料トライアルを始める
        </a><br>
        <span style="font-size: 13px; color: #64748b;">${FRONTEND_URL}/register</span>
      </p>

      <p>今後のご連絡は控えますので、ご興味がおありの際はお気軽にご返信ください。</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">

      <div style="color: #64748b; font-size: 13px;">
        <p style="margin: 0;">
          田中 | CareShift（介護施設向けシフト自動作成システム）<br>
          ${FRONTEND_URL}<br>
          お問い合わせ: ${SENDER_EMAIL}
        </p>
      </div>

      <p style="color: #94a3b8; font-size: 11px; margin-top: 15px;">
        ※ ご不要の場合は「配信停止」とご返信ください。
      </p>
    </div>
  `;
}

function buildEmailHtml(facilityName: string, step: number): string {
  switch (step) {
    case 1: return buildStep1Html(facilityName);
    case 2: return buildStep2Html(facilityName);
    case 3: return buildStep3Html(facilityName);
    default: return buildStep1Html(facilityName);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const startIndex = parseInt(args[0] || '0', 10);
  const count = parseInt(args[1] || '30', 10);
  const step = parseInt(args[2] || '1', 10);

  console.log(`\n=== Gmail SMTP バッチ送信（v2 改善版 Step${step}） ===`);
  console.log(`リスト件数: ${facilities.length}件`);
  console.log(`送信者: ${SENDER_NAME} <${SENDER_EMAIL}>`);
  console.log(`ステップ: ${step}/3`);

  if (count === 0) {
    console.log(`\n[ドライラン] 送信対象の確認のみ`);
    const preview = facilities.slice(startIndex, startIndex + 5);
    preview.forEach((f, i) => {
      console.log(`  ${startIndex + i}: ${f.name} <${f.email}>`);
      console.log(`    件名: ${getSubject(f.name, step)}`);
    });
    return;
  }

  const endIndex = Math.min(startIndex + count, facilities.length);
  const batch = facilities.slice(startIndex, endIndex);

  console.log(`対象: ${startIndex} 〜 ${endIndex - 1}（${batch.length}件）`);
  console.log(`=============================\n`);

  let success = 0;
  let fail = 0;
  const failed: string[] = [];

  for (let i = 0; i < batch.length; i++) {
    const f = batch[i];
    const subject = getSubject(f.name, step);

    try {
      const result = await transporter.sendMail({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: f.email,
        subject: subject,
        html: buildEmailHtml(f.name, step),
      });

      console.log(`[${startIndex + i + 1}/${endIndex}] ✅ ${f.name} (${f.email}) - ${result.messageId}`);
      success++;
    } catch (error: any) {
      console.error(`[${startIndex + i + 1}/${endIndex}] ❌ ${f.name} (${f.email}) - ${error.message}`);
      fail++;
      failed.push(`${f.name} <${f.email}>`);
    }

    // Gmail rate limit対策: 2秒間隔
    if (i < batch.length - 1) {
      await sleep(2000);
    }
  }

  console.log(`\n=== 送信結果（Step${step}） ===`);
  console.log(`成功: ${success}件`);
  console.log(`失敗: ${fail}件`);
  if (failed.length > 0) {
    console.log(`\n失敗リスト:`);
    failed.forEach(f => console.log(`  - ${f}`));
  }
  if (endIndex < facilities.length) {
    console.log(`\n次回: npx tsx scripts/batch-send-gmail-v2.ts ${endIndex} ${count} ${step}`);
  } else {
    console.log(`\n全件送信完了！`);
    if (step < 3) {
      const nextDays = step === 1 ? 3 : 7;
      console.log(`\n📅 ${nextDays}日後に Step${step + 1} を送信してください:`);
      console.log(`   npx tsx scripts/batch-send-gmail-v2.ts 0 ${facilities.length} ${step + 1}`);
    }
  }
  console.log(`================\n`);
}

main();
