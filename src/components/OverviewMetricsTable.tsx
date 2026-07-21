import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { StoreDetail, Store } from '../types';
import { useSettings } from '../context/SettingsContext';
import { fmtNumber, fmtPct } from '../lib/format';
import { achievementColor, bandColor, COLORS } from '../lib/colors';

interface Props {
  details: StoreDetail[];
  stores: Store[];
}

interface Row {
  key: string;
  store: Store;
  detail: StoreDetail;
  achieveRate: number;
  foodAmt: number;
  laborAmt: number;
  lunchPots: number | null;
  lunchPct: string | null;
  prevFoodPct: string | null;
  prevLaborPct: string | null;
  prevAvgSpend: number | null;
  lastYearRev: number | null;
}

type SortDir = 'desc' | 'asc' | null;

// Numeric getter per sortable column key
const GETTERS: Record<string, (r: Row) => number> = {
  target:         (r) => r.detail.target,
  revenue:        (r) => r.detail.revenue,
  achieveRate:    (r) => r.achieveRate,
  lastYear:       (r) => r.lastYearRev ?? -Infinity,
  foodAmt:        (r) => r.foodAmt,
  foodPct:        (r) => r.detail.foodCostPct,
  prevFoodPct:    (r) => parseFloat(r.prevFoodPct ?? '0') || 0,
  laborAmt:       (r) => r.laborAmt,
  laborPct:       (r) => r.detail.laborCostPct,
  prevLaborPct:   (r) => parseFloat(r.prevLaborPct ?? '0') || 0,
  guests:         (r) => r.detail.guests,
  avgSpend:       (r) => r.detail.avgSpend,
  prevAvgSpend:   (r) => r.prevAvgSpend ?? -Infinity,
  lunchPots:      (r) => r.lunchPots ?? -Infinity,
  lunchPct:       (r) => parseFloat(r.lunchPct ?? '0') || 0,
  memberTotal:    (r) => r.detail.member.total,
  memberNew:      (r) => r.detail.member.newCount,
  memberSpend:    (r) => r.detail.member.spend,
  memberSpendPct: (r) => r.detail.member.spendPct,
  voidCount:      (r) => r.detail.other.voidCount,
  voidAmt:        (r) => r.detail.other.voidAmount,
  wasteVeg:       (r) => r.detail.other.wasteVeg,
};

const strokeCollator = new Intl.Collator('zh-u-co-stroke', { sensitivity: 'base' });

function defaultSort(a: Row, b: Row) {
  return strokeCollator.compare(a.store.name, b.store.name);
}

function findAna(detail: StoreDetail, label: string) {
  return detail.analysis.find((a) => a.label === label);
}

function pctTag(val: number, band: { min: number; max: number }) {
  const color = bandColor(val, band);
  return <span style={{ color, fontWeight: 700 }}>{fmtPct(val)}</span>;
}

export default function OverviewMetricsTable({ details, stores }: Props) {
  const navigate = useNavigate();
  const { thresholds } = useSettings();
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  const rows: Row[] = details.map((d) => {
    const store = storeMap[d.storeId] ?? { id: d.storeId, name: d.storeId, regionId: '', managerName: '' };
    const achieveRate   = d.target > 0 ? d.revenue / d.target : 0;
    const lunchPotsAna  = findAna(d, '午間鍋數')?.current;
    const lunchPctAna   = findAna(d, '午間鍋佔比')?.current;
    const prevFoodAna   = findAna(d, '食材占比')?.prevMonth;
    const prevLaborAna  = findAna(d, '人事占比')?.prevMonth;
    const prevAvgAna    = findAna(d, '客單價')?.prevMonth;
    const lastYearAna   = findAna(d, '營業額')?.lastYear;
    return {
      key: d.storeId,
      store,
      detail: d,
      achieveRate,
      foodAmt:      Math.round(d.revenue * d.foodCostPct / 100),
      laborAmt:     Math.round(d.revenue * d.laborCostPct / 100),
      lunchPots:    typeof lunchPotsAna === 'number' ? lunchPotsAna : null,
      lunchPct:     typeof lunchPctAna  === 'string' ? lunchPctAna  : null,
      prevFoodPct:  typeof prevFoodAna  === 'string' ? prevFoodAna  : null,
      prevLaborPct: typeof prevLaborAna === 'string' ? prevLaborAna : null,
      prevAvgSpend: typeof prevAvgAna   === 'number' ? prevAvgAna   : null,
      lastYearRev:  typeof lastYearAna  === 'number' ? lastYearAna  : null,
    };
  });

  // ── Sort logic (3-click cycle: desc → asc → default) ─────────────
  const sortedRows = [...rows].sort((a, b) => {
    if (!sortCol || !sortDir) return defaultSort(a, b);
    const getter = GETTERS[sortCol];
    if (!getter) return defaultSort(a, b);
    const diff = getter(a) - getter(b);
    return sortDir === 'desc' ? -diff : diff;
  });

  function handleColClick(col: string) {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortDir('asc');
    } else {
      // asc → back to default
      setSortCol(null);
      setSortDir(null);
    }
  }

  // ── Column header helpers ─────────────────────────────────────────
  const HEADER_STYLE: React.CSSProperties = {
    background: '#eef5fa',
    color: '#1F4E5F',
    fontWeight: 700,
    fontSize: 12,
    textAlign: 'center',
    padding: '6px 8px',
  };

  const sortIcon = (col: string) => {
    if (sortCol !== col) return <span style={{ color: '#ccc', marginLeft: 3 }}>⇅</span>;
    return <span style={{ color: COLORS.primaryMid, marginLeft: 3 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  // Leaf column title: clickable + sort indicator
  const th = (col: string, label: string) => (
    <span
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      onClick={() => handleColClick(col)}
    >
      {label}{sortIcon(col)}
    </span>
  );

  // ── Column definitions ────────────────────────────────────────────
  const columns: ColumnsType<Row> = [
    {
      title: '門市',
      dataIndex: ['store', 'name'],
      key: 'storeName',
      fixed: 'left',
      width: 88,
      onHeaderCell: () => ({ style: { ...HEADER_STYLE, background: '#1F4E5F', color: '#fff' } }),
      render: (_: string, row: Row) => (
        <span
          style={{ color: COLORS.primaryMid, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          onClick={() => navigate(`/store/${row.store.id}`)}
        >
          {row.store.name}
        </span>
      ),
    },

    // ── 業績分析 ──────────────────────────────────────────────────────
    {
      title: '業績分析',
      onHeaderCell: () => ({ style: { ...HEADER_STYLE, background: '#c8e8c8' } }),
      children: [
        {
          title: th('target', '目標'),
          key: 'target', width: 82, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.detail.target),
        },
        {
          title: th('revenue', '實際營業額'),
          key: 'revenue', width: 95, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.detail.revenue),
        },
        {
          title: th('achieveRate', '達成率'),
          key: 'achieveRate', width: 80, align: 'center',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => (
            <span style={{ color: achievementColor(row.achieveRate), fontWeight: 700 }}>
              {fmtPct(row.achieveRate * 100)}
            </span>
          ),
        },
        {
          title: th('lastYear', '去年同期'),
          key: 'lastYear', width: 88, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) =>
            row.lastYearRev !== null ? fmtNumber(row.lastYearRev) : '—',
        },
      ],
    },

    // ── 食材 ──────────────────────────────────────────────────────────
    {
      title: '食材',
      onHeaderCell: () => ({ style: { ...HEADER_STYLE, background: '#fdf0a0' } }),
      children: [
        {
          title: th('foodAmt', '食材費用'),
          key: 'foodAmt', width: 88, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.foodAmt),
        },
        {
          title: th('foodPct', '本月食材%'),
          key: 'foodPct', width: 90, align: 'center',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => pctTag(row.detail.foodCostPct, thresholds.food),
        },
        {
          title: th('prevFoodPct', '上月食材%'),
          key: 'prevFoodPct', width: 90, align: 'center',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => row.prevFoodPct ?? '—',
        },
      ],
    },

    // ── 人事 ──────────────────────────────────────────────────────────
    {
      title: '人事',
      onHeaderCell: () => ({ style: { ...HEADER_STYLE, background: '#fad8e0' } }),
      children: [
        {
          title: th('laborAmt', '人事費用'),
          key: 'laborAmt', width: 82, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.laborAmt),
        },
        {
          title: th('laborPct', '本月人事%'),
          key: 'laborPct', width: 90, align: 'center',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => pctTag(row.detail.laborCostPct, thresholds.labor),
        },
        {
          title: th('prevLaborPct', '上月人事%'),
          key: 'prevLaborPct', width: 90, align: 'center',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => row.prevLaborPct ?? '—',
        },
      ],
    },

    // ── 來客 ──────────────────────────────────────────────────────────
    {
      title: '來客',
      onHeaderCell: () => ({ style: { ...HEADER_STYLE, background: '#c8dcf8' } }),
      children: [
        {
          title: th('guests', '來客數'),
          key: 'guests', width: 76, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.detail.guests),
        },
        {
          title: th('avgSpend', '客單價'),
          key: 'avgSpend', width: 76, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => `$${fmtNumber(row.detail.avgSpend)}`,
        },
        {
          title: th('prevAvgSpend', '上月客單價'),
          key: 'prevAvgSpend', width: 90, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) =>
            row.prevAvgSpend !== null ? `$${fmtNumber(row.prevAvgSpend)}` : '—',
        },
      ],
    },

    // ── 午間 ──────────────────────────────────────────────────────────
    {
      title: '午間',
      onHeaderCell: () => ({ style: { ...HEADER_STYLE, background: '#d0ebd0' } }),
      children: [
        {
          title: th('lunchPots', '午間鍋數'),
          key: 'lunchPots', width: 80, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) =>
            row.lunchPots !== null ? fmtNumber(row.lunchPots) : '—',
        },
        {
          title: th('lunchPct', '午間鍋估比'),
          key: 'lunchPct', width: 86, align: 'center',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => row.lunchPct ?? '—',
        },
      ],
    },

    // ── 會員 ──────────────────────────────────────────────────────────
    {
      title: '會員',
      onHeaderCell: () => ({ style: { ...HEADER_STYLE, background: '#fad8e0' } }),
      children: [
        {
          title: th('memberTotal', '會員人數'),
          key: 'memberTotal', width: 80, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.detail.member.total),
        },
        {
          title: th('memberNew', '本月新增'),
          key: 'memberNew', width: 76, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.detail.member.newCount),
        },
        {
          title: th('memberSpend', '消費金額'),
          key: 'memberSpend', width: 86, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.detail.member.spend),
        },
        {
          title: th('memberSpendPct', '消費估比'),
          key: 'memberSpendPct', width: 80, align: 'center',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => (
            <span style={{ color: COLORS.green, fontWeight: 700 }}>
              {fmtPct(row.detail.member.spendPct)}
            </span>
          ),
        },
      ],
    },

    // ── 其他 ──────────────────────────────────────────────────────────
    {
      title: '其他',
      onHeaderCell: () => ({ style: { ...HEADER_STYLE, background: '#c8dcf8' } }),
      children: [
        {
          title: th('voidCount', '作廢張數'),
          key: 'voidCount', width: 80, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.detail.other.voidCount),
        },
        {
          title: th('voidAmt', '作廢金額'),
          key: 'voidAmt', width: 82, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => fmtNumber(row.detail.other.voidAmount),
        },
        {
          title: th('wasteVeg', '損耗蔬菜kg'),
          key: 'wasteVeg', width: 90, align: 'right',
          onHeaderCell: () => ({ style: HEADER_STYLE }),
          render: (_: unknown, row: Row) => row.detail.other.wasteVeg,
        },
      ],
    },
  ];

  return (
    <Table<Row>
      size="small"
      dataSource={sortedRows}
      columns={columns}
      pagination={false}
      scroll={{ x: 'max-content' }}
      rowClassName={(row) => {
        const over = row.detail.foodCostPct > thresholds.food.max || row.detail.laborCostPct > thresholds.labor.max;
        return over ? 'table-row-warn' : '';
      }}
      summary={(pageData) => {
        const totalRevenue     = pageData.reduce((s, r) => s + r.detail.revenue, 0);
        const totalTarget      = pageData.reduce((s, r) => s + r.detail.target, 0);
        const totalGuests      = pageData.reduce((s, r) => s + r.detail.guests, 0);
        const totalFoodAmt     = pageData.reduce((s, r) => s + r.foodAmt, 0);
        const totalLaborAmt    = pageData.reduce((s, r) => s + r.laborAmt, 0);
        const totalMemberSpend = pageData.reduce((s, r) => s + r.detail.member.spend, 0);
        const avgRate = totalTarget > 0 ? totalRevenue / totalTarget : 0;

        return (
          <Table.Summary.Row style={{ background: '#eef5fa', fontWeight: 700 }}>
            <Table.Summary.Cell index={0}>合計</Table.Summary.Cell>
            <Table.Summary.Cell index={1}  align="right">{fmtNumber(totalTarget)}</Table.Summary.Cell>
            <Table.Summary.Cell index={2}  align="right">{fmtNumber(totalRevenue)}</Table.Summary.Cell>
            <Table.Summary.Cell index={3}  align="center">
              <span style={{ color: achievementColor(avgRate), fontWeight: 700 }}>
                {fmtPct(avgRate * 100)}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4}  align="right">—</Table.Summary.Cell>
            <Table.Summary.Cell index={5}  align="right">{fmtNumber(totalFoodAmt)}</Table.Summary.Cell>
            <Table.Summary.Cell index={6}  align="center">
              {fmtPct(totalRevenue > 0 ? (totalFoodAmt / totalRevenue) * 100 : 0)}
            </Table.Summary.Cell>
            <Table.Summary.Cell index={7}  align="center">—</Table.Summary.Cell>
            <Table.Summary.Cell index={8}  align="right">{fmtNumber(totalLaborAmt)}</Table.Summary.Cell>
            <Table.Summary.Cell index={9}  align="center">
              {fmtPct(totalRevenue > 0 ? (totalLaborAmt / totalRevenue) * 100 : 0)}
            </Table.Summary.Cell>
            <Table.Summary.Cell index={10} align="center">—</Table.Summary.Cell>
            <Table.Summary.Cell index={11} align="right">{fmtNumber(totalGuests)}</Table.Summary.Cell>
            <Table.Summary.Cell index={12} align="right">—</Table.Summary.Cell>
            <Table.Summary.Cell index={13} align="right">—</Table.Summary.Cell>
            <Table.Summary.Cell index={14} align="right">—</Table.Summary.Cell>
            <Table.Summary.Cell index={15} align="right">—</Table.Summary.Cell>
            <Table.Summary.Cell index={16} align="right">—</Table.Summary.Cell>
            <Table.Summary.Cell index={17} align="right">—</Table.Summary.Cell>
            <Table.Summary.Cell index={18} align="right">{fmtNumber(totalMemberSpend)}</Table.Summary.Cell>
            <Table.Summary.Cell index={19} align="center">—</Table.Summary.Cell>
            <Table.Summary.Cell index={20} align="right">—</Table.Summary.Cell>
            <Table.Summary.Cell index={21} align="right">—</Table.Summary.Cell>
            <Table.Summary.Cell index={22} align="right">—</Table.Summary.Cell>
          </Table.Summary.Row>
        );
      }}
    />
  );
}
