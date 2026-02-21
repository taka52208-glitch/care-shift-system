/**
 * v3メール バッチ送信スクリプト
 *
 * 「無料でシフト表を代行作成します」型テンプレート
 * 極短・売り込み感ゼロ・返信だけでOK
 *
 * 使い方:
 * npx tsx scripts/batch-send-v3.ts [開始番号] [件数]
 *
 * 例:
 * npx tsx scripts/batch-send-v3.ts 0 30    # 最初の30件
 * npx tsx scripts/batch-send-v3.ts 30 30   # 次の30件
 * npx tsx scripts/batch-send-v3.ts 0 0     # ドライラン（件数0で確認のみ）
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

interface Facility {
  name: string;
  email: string;
}

const facilitiesPath = join(__dirname, 'facilities.json');
const facilities: Facility[] = JSON.parse(readFileSync(facilitiesPath, 'utf-8'));

function buildEmailHtml(facilityName: string): string {
  return `
    <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; line-height: 2.0; color: #334155; font-size: 15px;">

      <p>${facilityName}<br>ご担当者様</p>

      <p>突然のご連絡失礼いたします。<br>
      介護施設専用のシフト管理ツール「CareShift」を開発しております。</p>

      <p><strong>1つだけお願いがございます。</strong></p>

      <p>現在お使いのシフト表（Excel・手書き何でも可）を<br>
      お送りいただけませんか？</p>

      <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;">
          当社で<strong>無料で</strong>CareShiftにスタッフ情報を入力し、<br>
          <strong>自動作成したシフト表をお返し</strong>いたします。
        </p>
      </div>

      <p>ご満足いただけなければ、それで終わりです。<br>
      <strong>費用は一切かかりません。</strong></p>

      <p>ご興味がございましたら、<br>
      <strong style="color: #059669;">このメールにご返信いただくだけ</strong>で結構です。</p>

      <p style="margin-top: 30px;">
        CareShift 担当<br>
        <span style="color: #64748b; font-size: 13px;">taka52208@gmail.com</span>
      </p>

      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
        ※ ご不要の場合は「配信停止」とご返信ください。今後のご連絡を控えます。
      </p>

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

  console.log(`\n=== v3メール バッチ送信（無料代行型） ===`);
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

    console.log(`\n[プレビュー] 件名例:`);
    if (preview.length > 0) {
      console.log(`  「${preview[0].name}様のシフト表、無料でお作りします」`);
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
    const subject = `${f.name}様のシフト表、無料でお作りします`;

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
  if (endIndex < facilities.length) {
    console.log(`次回: npx tsx scripts/batch-send-v3.ts ${endIndex} ${count}`);
  } else {
    console.log(`全件送信完了！`);
  }
  console.log(`================\n`);
}

main();
