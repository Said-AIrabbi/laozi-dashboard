import ExcelJS from 'exceljs';
import type { StoreDetail, Store } from '../types';

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  ops:    { sec: 'FF7DBD97', cell: 'FFD4EED8' }, // 營業分析: green
  member: { sec: 'FFD97B7B', cell: 'FFFBD6D6' }, // 會員分析: pink
  act:    { sec: 'FFCBA83C', cell: 'FFFFF2B8' }, // 活動商品: yellow
  other:  { sec: 'FF6490B8', cell: 'FFD0E8F8' }, // 其他: blue
  white:  'FFFFFFFF',
  title:  'FF1F4E5F',
};

function dateSuffix() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function anaVal(detail: StoreDetail, label: string) {
  return detail.analysis.find((a) => a.label === label);
}

function fill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top:    { style: 'thin', color: { argb: 'FFAAAAAA' } },
  left:   { style: 'thin', color: { argb: 'FFAAAAAA' } },
  bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
  right:  { style: 'thin', color: { argb: 'FFAAAAAA' } },
};

function styleCell(
  cell: ExcelJS.Cell,
  bgArgb: string,
  opts?: { bold?: boolean; align?: 'center' | 'left'; wrap?: boolean },
) {
  cell.fill = fill(bgArgb);
  cell.border = THIN_BORDER;
  cell.alignment = {
    horizontal: opts?.align ?? 'center',
    vertical: 'middle',
    wrapText: opts?.wrap ?? true,
  };
  cell.font = { name: 'Microsoft JhengHei', size: 10, bold: opts?.bold };
}

// Fill merged region cells to avoid uncoloured secondary cells
function fillRegion(ws: ExcelJS.Worksheet, startRow: number, endRow: number, col: number, argb: string) {
  for (let r = startRow; r <= endRow; r++) {
    const cell = ws.getRow(r).getCell(col);
    cell.fill   = fill(argb);
    cell.border = THIN_BORDER;
  }
}

function set(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: ExcelJS.CellValue,
  bgArgb: string,
  opts?: { bold?: boolean; align?: 'center' | 'left'; wrap?: boolean },
) {
  const cell = ws.getRow(row).getCell(col);
  cell.value = value ?? '';
  styleCell(cell, bgArgb, opts);
}

// ── Build one store worksheet ─────────────────────────────────────────────────
function buildStoreSheet(wb: ExcelJS.Workbook, store: Store, detail: StoreDetail, period: string) {
  const ws = wb.addWorksheet(store.name.substring(0, 31));

  ws.columns = [
    { width: 7  }, // A  section label
    { width: 20 }, // B  label
    { width: 13 }, // C  value
    { width: 20 }, // D
    { width: 13 }, // E
    { width: 20 }, // F
    { width: 13 }, // G
    { width: 20 }, // H
    { width: 13 }, // I
  ];

  // ── Derived values ─────────────────────────────────────────────────────────
  const foodAmt     = Math.round(detail.revenue * detail.foodCostPct  / 100);
  const laborAmt    = Math.round(detail.revenue * detail.laborCostPct / 100);
  const achieveRate = detail.target > 0
    ? `${(detail.revenue / detail.target * 100).toFixed(1)}%`
    : '#DIV/0!';

  const lunchPotsAna = anaVal(detail, '午間鍋數');
  const lunchPctAna  = anaVal(detail, '午間鍋佔比');
  const prevFoodAna  = anaVal(detail, '食材占比');
  const prevLaborAna = anaVal(detail, '人事占比');
  const prevAvgAna   = anaVal(detail, '客單價');
  const lastYearAna  = anaVal(detail, '營業額');
  // 原始值直接取 analysis 的 original 欄位
  const origFoodPct  = prevFoodAna?.original  ?? '';
  const origAvgSpend = prevAvgAna?.original   ?? '';

  // ── Row 1: Title ───────────────────────────────────────────────────────────
  ws.getRow(1).height = 30;
  ws.mergeCells('A1:I1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `${period}　${store.name}店營運報告`;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.font = { bold: true, size: 14, name: 'Microsoft JhengHei', color: { argb: C.title } };
  titleCell.border = THIN_BORDER;

  // ── Rows 2–6: 營業分析 ────────────────────────────────────────────────────
  ws.mergeCells('A2:A6');
  ws.getCell('A2').value = '營業\n分析';
  styleCell(ws.getCell('A2'), C.ops.sec, { bold: true });
  fillRegion(ws, 2, 6, 1, C.ops.sec);

  ws.getRow(2).height = 22;
  set(ws, 2, 2, '本月份營業目標',   C.ops.cell); set(ws, 2, 3, detail.target,    C.ops.cell);
  set(ws, 2, 4, '本月食材費用',     C.ops.cell); set(ws, 2, 5, foodAmt,          C.ops.cell);
  set(ws, 2, 6, '本月來客數',       C.ops.cell); set(ws, 2, 7, detail.guests,    C.ops.cell);
  set(ws, 2, 8, '本月人事費用',     C.ops.cell); set(ws, 2, 9, laborAmt,         C.ops.cell);

  ws.getRow(3).height = 36;
  set(ws, 3, 2, '本月份實際營業額\n(含線上票券金額)', C.ops.cell);
  set(ws, 3, 3, detail.revenue, C.ops.cell);
  set(ws, 3, 4, '本月食材占比',    C.ops.cell); set(ws, 3, 5, `${detail.foodCostPct}%`,  C.ops.cell);
  set(ws, 3, 6, '本月客單價',      C.ops.cell); set(ws, 3, 7, `$${detail.avgSpend}`,     C.ops.cell);
  set(ws, 3, 8, '本月人事占比',    C.ops.cell); set(ws, 3, 9, `${detail.laborCostPct}%`, C.ops.cell);

  ws.getRow(4).height = 22;
  set(ws, 4, 2, '本月業績達成率',   C.ops.cell); set(ws, 4, 3, achieveRate,                         C.ops.cell);
  set(ws, 4, 4, '上月食材占比',     C.ops.cell); set(ws, 4, 5, prevFoodAna?.prevMonth  ?? '',        C.ops.cell);
  set(ws, 4, 6, '上月客單價',       C.ops.cell); set(ws, 4, 7, prevAvgAna?.prevMonth   ?? '',        C.ops.cell);
  set(ws, 4, 8, '上月人事占比',     C.ops.cell); set(ws, 4, 9, prevLaborAna?.prevMonth ?? '',        C.ops.cell);

  ws.getRow(5).height = 36;
  set(ws, 5, 2, '去年同期實際營業額', C.ops.cell); set(ws, 5, 3, lastYearAna?.lastYear ?? '',        C.ops.cell);
  set(ws, 5, 4, '原始食材估比\n(不含活動)', C.ops.cell); set(ws, 5, 5, origFoodPct,                 C.ops.cell);
  set(ws, 5, 6, '原始客單價\n(不含活動)',   C.ops.cell); set(ws, 5, 7, origAvgSpend,                 C.ops.cell);
  set(ws, 5, 8, '',                C.ops.cell); set(ws, 5, 9, '',                                    C.ops.cell);

  ws.getRow(6).height = 22;
  set(ws, 6, 2, '午間鍋數',  C.ops.cell);
  set(ws, 6, 3, typeof lunchPotsAna?.current === 'number' ? lunchPotsAna.current : '', C.ops.cell);
  set(ws, 6, 4, '午間鍋估比', C.ops.cell);
  set(ws, 6, 5, lunchPctAna?.current ?? '', C.ops.cell);
  set(ws, 6, 6, '', C.ops.cell); set(ws, 6, 7, '', C.ops.cell);
  set(ws, 6, 8, '', C.ops.cell); set(ws, 6, 9, '', C.ops.cell);

  // ── Rows 7–8: 會員分析 ────────────────────────────────────────────────────
  ws.mergeCells('A7:A8');
  ws.getCell('A7').value = '會員\n分析';
  styleCell(ws.getCell('A7'), C.member.sec, { bold: true });
  fillRegion(ws, 7, 8, 1, C.member.sec);

  ws.getRow(7).height = 22;
  set(ws, 7, 2, '會員總人數',   C.member.cell); set(ws, 7, 3, detail.member.total,    C.member.cell);
  set(ws, 7, 4, '本月新增會員數', C.member.cell); set(ws, 7, 5, detail.member.newCount, C.member.cell);
  set(ws, 7, 6, '本月會員成長率', C.member.cell);
  set(ws, 7, 7, detail.member.growthPct != null ? `${detail.member.growthPct}%` : '', C.member.cell);
  set(ws, 7, 8, '會員消費估比', C.member.cell);
  set(ws, 7, 9, `${detail.memberSpendPct}%`, C.member.cell);

  ws.getRow(8).height = 22;
  set(ws, 8, 2, '', C.member.cell); set(ws, 8, 3, '', C.member.cell);
  set(ws, 8, 4, '', C.member.cell); set(ws, 8, 5, '', C.member.cell);
  set(ws, 8, 6, '', C.member.cell); set(ws, 8, 7, '', C.member.cell);
  set(ws, 8, 8, '會員消費金額', C.member.cell); set(ws, 8, 9, detail.member.spend, C.member.cell);

  // ── Rows 9–10: 活動商品分析 ──────────────────────────────────────────────
  ws.mergeCells('A9:A10');
  ws.getCell('A9').value = '活動\n商品\n分析';
  styleCell(ws.getCell('A9'), C.act.sec, { bold: true });
  fillRegion(ws, 9, 10, 1, C.act.sec);

  const acts = detail.activities;
  for (let r = 0; r < 2; r++) {
    ws.getRow(9 + r).height = 36;
    for (let col = 0; col < 4; col++) {
      const act = acts[r * 4 + col];
      const baseCol = 2 + col * 2; // 2, 4, 6, 8
      set(ws, 9 + r, baseCol,     act ? `${act.name}\n數量/金額` : '', C.act.cell);
      set(ws, 9 + r, baseCol + 1, act ? `${act.qty} / ${act.amount}` : '', C.act.cell);
    }
  }

  // ── Row 11: 其他 ──────────────────────────────────────────────────────────
  ws.getRow(11).height = 36;
  set(ws, 11, 1, '其他', C.other.sec, { bold: true });

  const b = detail.other.staffMealBreakdown;
  set(ws, 11, 2, '碎肉(kg)\n豬/牛', C.other.cell);
  set(ws, 11, 3, `${detail.other.scrapPork} / ${detail.other.scrapBeef}`, C.other.cell);
  set(ws, 11, 4, '員工餐(份)\n梅豬/五花/牛花', C.other.cell);
  set(ws, 11, 5, b
    ? `${b.plumPork} / ${b.belly} / ${b.beef}`
    : String(detail.other.staffMeals), C.other.cell);
  set(ws, 11, 6, '作廢張數\n張數/金額', C.other.cell);
  set(ws, 11, 7, `${detail.other.voidCount} / ${detail.other.voidAmount}`, C.other.cell);
  set(ws, 11, 8, '損耗蔬菜(kg)\n數量', C.other.cell);
  set(ws, 11, 9, detail.other.wasteVeg, C.other.cell);
}

// ── Download helper ───────────────────────────────────────────────────────────
async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Public API ────────────────────────────────────────────────────────────────

/** 單店匯出 — 一個工作表 */
export async function exportStoreDetailExcel(store: Store, detail: StoreDetail, period: string) {
  const wb = new ExcelJS.Workbook();
  buildStoreSheet(wb, store, detail, period);
  await downloadWorkbook(wb, `荖子鍋_${store.name}_${period}_${dateSuffix()}.xlsx`);
}

/** 全店匯出 — 每店一個工作表 */
export async function exportOverviewExcel(details: StoreDetail[], stores: Store[], period: string) {
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));
  const wb = new ExcelJS.Workbook();
  for (const detail of details) {
    const store = storeMap[detail.storeId];
    if (!store) continue;
    buildStoreSheet(wb, store, detail, period);
  }
  await downloadWorkbook(wb, `荖子鍋_全店月報_${period}_${dateSuffix()}.xlsx`);
}
