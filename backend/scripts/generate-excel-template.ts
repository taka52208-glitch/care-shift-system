/**
 * 介護シフト表Excelテンプレート生成スクリプト
 *
 * 使い方:
 * cd backend && npx tsx scripts/generate-excel-template.ts
 *
 * 出力: ../frontend/public/templates/kaigo-shift-template.xlsx
 */
import ExcelJS from 'exceljs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_PATH = join(__dirname, '../../frontend/public/templates/kaigo-shift-template.xlsx');

const SHIFT_TYPES = {
  '早': { bg: 'FFE8F5E9', font: 'FF2E7D32' },
  '日': { bg: 'FFE3F2FD', font: 'FF1565C0' },
  '遅': { bg: 'FFFFF3E0', font: 'FFE65100' },
  '夜': { bg: 'FFEDE7F6', font: 'FF4527A0' },
  '明': { bg: 'FFFCE4EC', font: 'FFC62828' },
  '休': { bg: 'FFF5F5F5', font: 'FF757575' },
};

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CareShift';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('シフト表', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 3 }],
  });

  // --- ヘッダー ---
  sheet.mergeCells('A1:AF1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '介護施設 月間シフト表';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  // 年月入力セル
  sheet.getCell('A2').value = '対象月:';
  sheet.getCell('A2').font = { bold: true, size: 11 };
  sheet.getCell('B2').value = '2026年4月';
  sheet.getCell('B2').font = { size: 11, color: { argb: 'FF2563EB' } };
  sheet.getCell('B2').border = {
    bottom: { style: 'thin', color: { argb: 'FF2563EB' } },
  };

  // 凡例
  sheet.getCell('D2').value = '凡例:';
  sheet.getCell('D2').font = { bold: true, size: 10 };
  let col = 5;
  for (const [label, style] of Object.entries(SHIFT_TYPES)) {
    const cell = sheet.getCell(2, col);
    cell.value = label;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.bg } };
    cell.font = { bold: true, color: { argb: style.font }, size: 10 };
    cell.alignment = { horizontal: 'center' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    col++;
  }

  // --- 列ヘッダー（3行目） ---
  const headerRow = sheet.getRow(3);
  headerRow.height = 22;

  sheet.getColumn(1).width = 14;
  sheet.getCell('A3').value = 'スタッフ名';
  sheet.getCell('A3').font = { bold: true, size: 10 };
  sheet.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  sheet.getCell('A3').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  sheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

  // 日付列（1〜31日）
  for (let d = 1; d <= 31; d++) {
    const colIdx = d + 1;
    sheet.getColumn(colIdx).width = 4.5;
    const cell = sheet.getCell(3, colIdx);
    cell.value = d;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'hair' },
      right: { style: 'hair' },
    };
  }

  // 夜勤回数列
  const nightCol = 33;
  sheet.getColumn(nightCol).width = 8;
  const nightHeader = sheet.getCell(3, nightCol);
  nightHeader.value = '夜勤数';
  nightHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
  nightHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
  nightHeader.alignment = { horizontal: 'center', vertical: 'middle' };

  // 休日数列
  const offCol = 34;
  sheet.getColumn(offCol).width = 8;
  const offHeader = sheet.getCell(3, offCol);
  offHeader.value = '休日数';
  offHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
  offHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  offHeader.alignment = { horizontal: 'center', vertical: 'middle' };

  // --- スタッフ行（4〜23行 = 20名分） ---
  const sampleNames = [
    '田中 花子', '佐藤 太郎', '鈴木 美咲', '山田 健一', '高橋 由美',
    '', '', '', '', '',
    '', '', '', '', '',
    '', '', '', '', '',
  ];

  for (let i = 0; i < 20; i++) {
    const rowIdx = 4 + i;
    const row = sheet.getRow(rowIdx);
    row.height = 22;

    // スタッフ名
    const nameCell = sheet.getCell(rowIdx, 1);
    nameCell.value = sampleNames[i];
    nameCell.font = { size: 10 };
    nameCell.alignment = { vertical: 'middle' };
    nameCell.border = {
      bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin' },
    };

    // 背景色（偶数行にストライプ）
    const rowBg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

    // 日別セル
    for (let d = 1; d <= 31; d++) {
      const cell = sheet.getCell(rowIdx, d + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { size: 10, bold: true };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        right: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      };
    }

    // 条件付き書式用のデータ入力規則（ドロップダウン）
    for (let d = 1; d <= 31; d++) {
      sheet.getCell(rowIdx, d + 1).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"早,日,遅,夜,明,休"'],
      };
    }

    // 夜勤回数（COUNTIF）
    const nightCell = sheet.getCell(rowIdx, nightCol);
    const rowLetter = rowIdx;
    nightCell.value = { formula: `COUNTIF(B${rowLetter}:AF${rowLetter},"夜")` };
    nightCell.alignment = { horizontal: 'center', vertical: 'middle' };
    nightCell.font = { size: 10, bold: true, color: { argb: 'FF7C3AED' } };

    // 休日数（COUNTIF）
    const offCell = sheet.getCell(rowIdx, offCol);
    offCell.value = { formula: `COUNTIF(B${rowLetter}:AF${rowLetter},"休")+COUNTIF(B${rowLetter}:AF${rowLetter},"明")` };
    offCell.alignment = { horizontal: 'center', vertical: 'middle' };
    offCell.font = { size: 10, bold: true, color: { argb: 'FF059669' } };
  }

  // --- 集計行 ---
  const summaryStartRow = 25;
  const summaryLabels = ['早番', '日勤', '遅番', '夜勤'];
  const summaryKeys = ['早', '日', '遅', '夜'];
  const summaryColors = ['FF2E7D32', 'FF1565C0', 'FFE65100', 'FF4527A0'];

  for (let s = 0; s < summaryLabels.length; s++) {
    const rowIdx = summaryStartRow + s;
    const row = sheet.getRow(rowIdx);
    row.height = 20;

    const labelCell = sheet.getCell(rowIdx, 1);
    labelCell.value = summaryLabels[s];
    labelCell.font = { bold: true, size: 9, color: { argb: summaryColors[s] } };
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

    for (let d = 1; d <= 31; d++) {
      const cell = sheet.getCell(rowIdx, d + 1);
      const colLetter = String.fromCharCode(65 + d);
      cell.value = { formula: `COUNTIF(${colLetter}4:${colLetter}23,"${summaryKeys[s]}")` };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { size: 9, bold: true, color: { argb: summaryColors[s] } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      };
    }
  }

  // --- 配置基準チェック行 ---
  const checkRow = summaryStartRow + summaryLabels.length + 1;
  sheet.getRow(checkRow).height = 20;
  const checkLabel = sheet.getCell(checkRow, 1);
  checkLabel.value = '必要人員';
  checkLabel.font = { bold: true, size: 9, color: { argb: 'FFDC2626' } };
  checkLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  checkLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };

  for (let d = 1; d <= 31; d++) {
    const cell = sheet.getCell(checkRow, d + 1);
    cell.value = 3; // デフォルト必要人員数
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { size: 9, bold: true, color: { argb: 'FFDC2626' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
  }

  // --- フッター注意書き ---
  const noteRow = checkRow + 2;
  sheet.mergeCells(`A${noteRow}:AF${noteRow}`);
  const noteCell = sheet.getCell(`A${noteRow}`);
  noteCell.value = '※ このテンプレートは CareShift（https://care-shift-system.vercel.app）が無料提供しています。自動シフト生成をお試しください。';
  noteCell.font = { size: 9, color: { argb: 'FF94A3B8' }, italic: true };

  // --- 条件付き書式（セルの色分け） ---
  for (const [key, style] of Object.entries(SHIFT_TYPES)) {
    sheet.addConditionalFormatting({
      ref: 'B4:AF23',
      rules: [{
        type: 'cellIs',
        operator: 'equal',
        formulae: [`"${key}"`],
        style: {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: style.bg } },
          font: { bold: true, color: { argb: style.font } },
        },
        priority: 1,
      }],
    });
  }

  // --- 印刷設定 ---
  sheet.pageSetup = {
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
  };

  // 保存
  await workbook.xlsx.writeFile(OUTPUT_PATH);
  console.log(`✅ テンプレート生成完了: ${OUTPUT_PATH}`);
}

generateTemplate().catch(console.error);
