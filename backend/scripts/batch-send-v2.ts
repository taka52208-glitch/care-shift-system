/**
 * v2メール バッチ送信スクリプト
 *
 * facilities.json から施設リストを読み込み、v2テンプレートで送信
 * 1通ごとに1秒のスリープでRate Limit回避
 *
 * 使い方:
 * npx tsx scripts/batch-send-v2.ts [開始番号] [件数]
 *
 * 例:
 * npx tsx scripts/batch-send-v2.ts 0 30    # 最初の30件
 * npx tsx scripts/batch-send-v2.ts 30 30   # 次の30件
 * npx tsx scripts/batch-send-v2.ts 0 0     # ドライラン（件数0で確認のみ）
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'CareShift <taka52208@gmail.com>';
const FRONTEND_URL = 'https://care-shift-system.vercel.app';

interface Facility {
  name: string;
  email: string;
}

// facilities.json から読み込み
const facilitiesPath = join(__dirname, 'facilities.json');
const facilities: Facility[] = JSON.parse(readFileSync(facilitiesPath, 'utf-8'));

function buildEmailHtml(facilityName: string): string {
  return `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.8; color: #334155;">

      <p>${facilityName}<br>施設長様（ご担当者様）</p>

      <p>以前ご案内いたしました、介護施設専門シフト管理システム「CareShift」です。<br>
      お忙しい中、改めてのご連絡失礼いたします。</p>

      <p>本日は、施設の方からよくいただく<strong>3つのご質問</strong>にお答えいたします。</p>

      <div style="margin: 25px 0;">

        <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #667eea;">Q. パソコンが苦手でも使えますか？</p>
          <p style="margin: 0; font-size: 14px;">
            はい。シフト自動生成は<strong>ボタン1つ</strong>で完了します。<br>
            導入時の初期設定も無料でサポートいたします。
          </p>
        </div>

        <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #667eea;">Q. 月額9,800円は高くないですか？</p>
          <p style="margin: 0; font-size: 14px;">
            <strong>スタッフ数無制限</strong>の定額制です。30名なら1人あたり月額わずか327円。<br>
            さらに<strong style="color: #2563eb;">介護ICT補助金（補助率1/2〜3/4）</strong>で実質負担を大幅軽減できます。
          </p>
        </div>

        <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #667eea;">Q. 無料トライアル後に自動課金されますか？</p>
          <p style="margin: 0; font-size: 14px;">
            いいえ。<strong>クレジットカードの登録は不要</strong>です。<br>
            14日間すべての機能を無料でお試しいただけます。
          </p>
        </div>

      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/register"
           style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          14日間無料で試す
        </a>
        <br>
        <a href="${FRONTEND_URL}#demo"
           style="display: inline-block; margin-top: 12px; color: #2563eb; text-decoration: underline; font-size: 14px;">
          まずは画面イメージを見る →
        </a>
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
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Error] RESEND_API_KEY not set');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const startIndex = parseInt(args[0] || '0', 10);
  const count = parseInt(args[1] || '30', 10);

  console.log(`\n=== v2メール バッチ送信 ===`);
  console.log(`リスト件数: ${facilities.length}件`);

  if (count === 0) {
    console.log(`\n[ドライラン] 送信対象の確認のみ`);
    const preview = facilities.slice(startIndex, startIndex + 10);
    preview.forEach((f, i) => {
      console.log(`  ${startIndex + i}: ${f.name} <${f.email}>`);
    });
    if (facilities.length > startIndex + 10) {
      console.log(`  ... 他 ${facilities.length - startIndex - 10}件`);
    }
    return;
  }

  const endIndex = Math.min(startIndex + count, facilities.length);
  const batch = facilities.slice(startIndex, endIndex);

  console.log(`対象: ${startIndex} 〜 ${endIndex - 1}（${batch.length}件）`);
  console.log(`=============================\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < batch.length; i++) {
    const f = batch[i];
    const subject = `${f.name}様｜「パソコンが苦手でも使えますか？」への回答`;

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: f.email,
        subject: subject,
        html: buildEmailHtml(f.name),
      });

      console.log(`[${startIndex + i + 1}/${endIndex}] ✅ ${f.name} (${f.email}) - ID: ${result.data?.id}`);
      success++;
    } catch (error) {
      console.error(`[${startIndex + i + 1}/${endIndex}] ❌ ${f.name} (${f.email}) - ${error}`);
      fail++;
    }

    if (i < batch.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`\n=== 送信結果 ===`);
  console.log(`成功: ${success}件`);
  console.log(`失敗: ${fail}件`);
  console.log(`次回: npx tsx scripts/batch-send-v2.ts ${endIndex} ${count}`);
  console.log(`================\n`);
}

main();
