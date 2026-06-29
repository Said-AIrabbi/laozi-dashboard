import type { StoreDetail, MallData } from '../types';

const TREND_LABELS = ['9月', '10月', '11月', '12月', '1月', '2月'];

/* ── 平鎮店（完全依 prompt 數字） ──────────────────────────────── */
const pzDetail: StoreDetail = {
  storeId: 's-pz',
  period: '2026-02',
  revenue: 312734,
  target: 330000,
  guests: 668,
  avgSpend: 468,
  foodCostPct: 35.6,
  laborCostPct: 16.9,
  memberSpendPct: 63.4,
  trend: [
    { label: '9月',  revenue: 288000 },
    { label: '10月', revenue: 296000 },
    { label: '11月', revenue: 305200 },
    { label: '12月', revenue: 331000 },
    { label: '1月',  revenue: 305200 },
    { label: '2月',  revenue: 312734 },
  ],
  analysis: [
    { label: '營業額',    current: 312734, prevMonth: 305200, lastYear: 298500, original: 324000 },
    { label: '食材占比',  current: '35.6%', prevMonth: '34.1%', lastYear: '32.8%', original: '33.2%' },
    { label: '客單價',    current: 468, prevMonth: 471, lastYear: 455, original: 482 },
    { label: '人事占比',  current: '16.9%', prevMonth: '16.2%', lastYear: '15.8%', original: '16.5%' },
    { label: '午間鍋數',  current: 1180, prevMonth: 1205, lastYear: 1140, original: 1180 },
    { label: '午間鍋佔比', current: '41.0%', prevMonth: '42.3%', lastYear: '40.5%', original: '41.0%' },
  ],
  foodCategories: [
    { category: '肉類',   pct: 12.8 },
    { category: '蔬菜',   pct: 7.9  },
    { category: '海鮮',   pct: 5.1  },
    { category: '火鍋料', pct: 4.3  },
    { category: '南北雜貨', pct: 3.2 },
    { category: '飲料',   pct: 2.3  },
  ],
  member: { total: 4820, newCount: 132, growthPct: 2.8, spend: 198300, spendPct: 63.4 },
  activities: [
    { name: '95折',           qty: 86,  amount: 12400 },
    { name: '員工券500折250',  qty: 40,  amount: 10000 },
    { name: '公關券500抵用卷', qty: 12,  amount: 4800  },
    { name: '實體券500折50',   qty: 64,  amount: 3200  },
    { name: '小白單600折100',  qty: 28,  amount: 2800  },
    { name: 'Ocard500折50',   qty: 51,  amount: 2550  },
    { name: 'Ocard(肉品五選一)', qty: 18, amount: 2160 },
    { name: '線上票券',        qty: 73,  amount: 21900 },
  ],
  other: {
    scrapPork: 8.5,
    scrapBeef: 6.2,
    staffMeals: 96,
    staffMealBreakdown: { plumPork: 38, belly: 40, beef: 18 },
    voidCount: 14,
    voidAmount: 6820,
    wasteVeg: 23,
  },
  qualitative: {
    auditScore: 92,
    improvementPlan: '2 月情人節活動肉品贈送比例偏高致食材超標，3 月起調整贈品結構並控管備料。',
    staffing: '現有 外場6/內場5；目標 外場6/內場6；預計招募 內場1',
    equipment: '二號冷藏櫃溫度偏高，已報修。',
    performanceNote: '淡季來客微降，會員回購與線上票券撐住客單；下月以午間套餐拉抬午間鍋佔比。',
  },
  mall: {
    competitors: [
      { name: '鬍鬚張魯肉飯', revenue: 298000 },
      { name: '品川拉麵',      revenue: 245000 },
      { name: '漢來美食',      revenue: 322000 },
      { name: '肯德基',        revenue: 267000 },
    ],
    trend: TREND_LABELS.map((label, i) => ({
      label,
      sharePct: [20.1, 20.5, 21.0, 21.8, 21.3, 21.6][i],
    })),
  },
};

/* ── 其他門市通用產生器 ────────────────────────────────────────── */
function makeDetail(
  storeId: string,
  revenue: number,
  target: number,
  guests: number,
  avgSpend: number,
  foodCostPct: number,
  laborCostPct: number,
  memberSpendPct: number,
  managerName: string,
  mall: MallData,
): StoreDetail {
  const prevRev      = Math.round(revenue * 0.98);
  const lastYearRev  = Math.round(revenue * 0.93);
  const origRev      = Math.round(revenue * 1.02);
  const prevFood     = parseFloat((foodCostPct - 0.5).toFixed(1));
  const lastYearFood = parseFloat((foodCostPct + 0.3).toFixed(1));
  const origFood     = parseFloat((foodCostPct - 0.8).toFixed(1));
  const prevSpend    = avgSpend + 5;
  const lastYearSpend = avgSpend - 8;
  const origSpend    = avgSpend + 12;
  const prevLabor    = parseFloat((laborCostPct - 0.3).toFixed(1));
  const lastYearLabor = parseFloat((laborCostPct + 0.5).toFixed(1));
  const origLabor    = parseFloat((laborCostPct - 0.2).toFixed(1));
  const lunchPots    = Math.round(guests * 0.58);
  const prevLunchPots = Math.round(guests * 0.61);
  const lastYearLunchPots = Math.round(guests * 0.55);

  const foodAmt = Math.round(revenue * foodCostPct / 100);

  return {
    storeId,
    period: '2026-02',
    revenue,
    target,
    guests,
    avgSpend,
    foodCostPct,
    laborCostPct,
    memberSpendPct,
    trend: [
      { label: '9月',  revenue: Math.round(revenue * 0.86) },
      { label: '10月', revenue: Math.round(revenue * 0.90) },
      { label: '11月', revenue: Math.round(revenue * 0.95) },
      { label: '12月', revenue: Math.round(revenue * 1.06) },
      { label: '1月',  revenue: Math.round(revenue * 0.97) },
      { label: '2月',  revenue },
    ],
    analysis: [
      { label: '營業額',     current: revenue,       prevMonth: prevRev,        lastYear: lastYearRev,  original: origRev },
      { label: '食材占比',   current: `${foodCostPct}%`, prevMonth: `${prevFood}%`, lastYear: `${lastYearFood}%`, original: `${origFood}%` },
      { label: '客單價',     current: avgSpend,      prevMonth: prevSpend,      lastYear: lastYearSpend, original: origSpend },
      { label: '人事占比',   current: `${laborCostPct}%`, prevMonth: `${prevLabor}%`, lastYear: `${lastYearLabor}%`, original: `${origLabor}%` },
      { label: '午間鍋數',   current: lunchPots,     prevMonth: prevLunchPots,  lastYear: lastYearLunchPots, original: lunchPots },
      { label: '午間鍋佔比', current: '43.2%',       prevMonth: '44.1%',        lastYear: '41.8%',       original: '43.2%' },
    ],
    foodCategories: [
      { category: '肉類',     pct: parseFloat((foodCostPct * 0.36).toFixed(1)) },
      { category: '蔬菜',     pct: parseFloat((foodCostPct * 0.22).toFixed(1)) },
      { category: '海鮮',     pct: parseFloat((foodCostPct * 0.14).toFixed(1)) },
      { category: '火鍋料',   pct: parseFloat((foodCostPct * 0.12).toFixed(1)) },
      { category: '南北雜貨', pct: parseFloat((foodCostPct * 0.09).toFixed(1)) },
      { category: '飲料',     pct: parseFloat((foodCostPct * 0.07).toFixed(1)) },
    ],
    member: {
      total:     Math.round(guests * 7.1),
      newCount:  Math.round(guests * 0.19),
      growthPct: parseFloat((2.2 + Math.random() * 1.5).toFixed(1)),
      spend:     Math.round(revenue * memberSpendPct / 100),
      spendPct:  memberSpendPct,
    },
    activities: [
      { name: '95折',           qty: Math.round(guests * 0.08), amount: Math.round(revenue * 0.025) },
      { name: '員工券500折250',  qty: Math.round(guests * 0.04), amount: Math.round(revenue * 0.018) },
      { name: '公關券500抵用卷', qty: Math.round(guests * 0.012), amount: Math.round(revenue * 0.010) },
      { name: '實體券500折50',   qty: Math.round(guests * 0.06), amount: Math.round(revenue * 0.009) },
      { name: '小白單600折100',  qty: Math.round(guests * 0.03), amount: Math.round(revenue * 0.008) },
      { name: 'Ocard500折50',   qty: Math.round(guests * 0.05), amount: Math.round(revenue * 0.007) },
      { name: 'Ocard(肉品五選一)', qty: Math.round(guests * 0.02), amount: Math.round(revenue * 0.006) },
      { name: '線上票券',        qty: Math.round(guests * 0.07), amount: Math.round(revenue * 0.055) },
    ],
    other: {
      scrapPork: parseFloat((foodAmt * 0.00008).toFixed(1)),
      scrapBeef: parseFloat((foodAmt * 0.00006).toFixed(1)),
      staffMeals: Math.round(guests * 0.14),
      staffMealBreakdown: {
        plumPork: Math.round(guests * 0.055),
        belly:    Math.round(guests * 0.055),
        beef:     Math.round(guests * 0.030),
      },
      voidCount:  Math.round(guests * 0.018),
      voidAmount: Math.round(revenue * 0.016),
      wasteVeg:   Math.round(guests * 0.033),
    },
    qualitative: {
      auditScore: Math.round(85 + Math.random() * 10),
      improvementPlan: '持續監控食材備量，優化採購頻率以降低損耗率，目標降至合理區間。',
      staffing: `現有 外場6/內場5；目標 外場6/內場6；${managerName} 負責班表調度`,
      equipment: '設備運作正常，例行保養已完成，冷藏設備溫度穩定。',
      performanceNote: '本月業績穩健，會員活動帶動客單提升，持續推動午間套餐提升午間鍋數。',
    },
    mall,
  };
}

const ZERO_MALL: MallData = {
  competitors: [],
  trend: TREND_LABELS.map((label) => ({ label, sharePct: 0 })),
};

export const mockStoreDetails: Record<string, StoreDetail> = {
  's-pz': pzDetail,
  's-ty': makeDetail('s-ty', 521800, 483000, 1045, 499, 30.5, 14.9, 61.0, '林志明', {
    competitors: [
      { name: '爭鮮壽司',   revenue: 485000 },
      { name: '瓦城泰料理', revenue: 392000 },
      { name: '漢來海港',   revenue: 341000 },
      { name: '麥當勞',     revenue: 628000 },
      { name: '鼎泰豐',     revenue: 512000 },
    ],
    trend: TREND_LABELS.map((label, i) => ({
      label,
      sharePct: [16.8, 17.2, 17.5, 18.1, 17.8, 18.1][i],
    })),
  }),
  's-zl': makeDetail('s-zl', 458200, 440000, 935, 490, 31.2, 15.8, 60.5, '陳怡君', {
    competitors: [
      { name: '八方雲集', revenue: 320000 },
      { name: '王品牛排', revenue: 445000 },
      { name: '西堤牛排', revenue: 398000 },
      { name: '星巴克',   revenue: 286000 },
    ],
    trend: TREND_LABELS.map((label, i) => ({
      label,
      sharePct: [22.5, 23.1, 23.5, 24.2, 23.8, 24.0][i],
    })),
  }),
  's-zb': makeDetail('s-zb', 433100, 437000, 905, 479, 33.1, 15.6, 58.8, '黃建宏', {
    competitors: [
      { name: '海壽司',     revenue: 362000 },
      { name: '漢堡王',     revenue: 275000 },
      { name: '牛角日式燒肉', revenue: 389000 },
      { name: '莫凡彼',     revenue: 198000 },
    ],
    trend: TREND_LABELS.map((label, i) => ({
      label,
      sharePct: [24.8, 25.2, 25.6, 26.2, 25.9, 26.1][i],
    })),
  }),
  's-bd': makeDetail('s-bd', 389500, 386000, 812, 480, 32.8, 16.1, 59.4, '吳家瑋', {
    competitors: [
      { name: '麥當勞', revenue: 287000 },
      { name: '薩莉亞', revenue: 231000 },
    ],
    trend: TREND_LABELS.map((label, i) => ({
      label,
      sharePct: [41.2, 41.8, 42.1, 43.0, 42.5, 42.9][i],
    })),
  }),
  's-hc': makeDetail('s-hc', 276400, 314000, 590, 469, 36.9, 18.2, 57.2, '張雅婷', ZERO_MALL),
};
