import ReactECharts from 'echarts-for-react';
import type { MallCompetitor } from '../types';
import { fmtNumber } from '../lib/format';
import { COLORS } from '../lib/colors';

interface Props {
  ownLabel: string;
  ownRevenue: number;
  competitors: MallCompetitor[];
  mallName?: string;
}

const GRAY_PALETTE = ['#b0b8c1', '#8c98a4', '#c8d0d8', '#9daab5', '#d4dbe2', '#7a8898'];

export default function MallPieChart({ ownLabel, ownRevenue, competitors, mallName }: Props) {
  const hasData = competitors.length > 0 && competitors.some((c) => c.revenue > 0);

  if (!hasData) {
    return (
      <div
        style={{
          height: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#bbb',
          fontSize: 13,
          gap: 8,
        }}
      >
        <div style={{ fontSize: 32 }}>—</div>
        <div>尚無商場競爭資料</div>
        {mallName && <div style={{ fontSize: 11 }}>{mallName}</div>}
      </div>
    );
  }

  const total = ownRevenue + competitors.reduce((s, c) => s + c.revenue, 0);

  const data = [
    {
      name: ownLabel,
      value: ownRevenue,
      itemStyle: { color: COLORS.primaryMid },
    },
    ...competitors.map((c, i) => ({
      name: c.name,
      value: c.revenue,
      itemStyle: { color: GRAY_PALETTE[i % GRAY_PALETTE.length] },
    })),
  ];

  const ownPct = total > 0 ? ((ownRevenue / total) * 100).toFixed(1) : '0.0';

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value, percent }: { name: string; value: number; percent: number }) =>
        `<b>${name}</b><br/>營收：${fmtNumber(value)}<br/>占比：${percent.toFixed(1)}%`,
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '40%',
        style: { text: '本店占比', textAlign: 'center', fill: '#888', fontSize: 11 },
      },
      {
        type: 'text',
        left: 'center',
        top: '48%',
        style: {
          text: `${ownPct}%`,
          textAlign: 'center',
          fill: COLORS.primaryDark,
          fontSize: 20,
          fontWeight: 'bold',
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['36%', '60%'],
        center: ['50%', '52%'],
        label: {
          show: true,
          position: 'outside',
          formatter: ({ name, value, percent }: { name: string; value: number; percent: number }) =>
            `${name}\n${(value / 10000).toFixed(1)}萬（${percent.toFixed(1)}%）`,
          fontSize: 11,
          lineHeight: 16,
          color: '#444',
        },
        labelLine: { show: true, length: 10, length2: 6 },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.15)' },
          label: { fontWeight: 'bold' },
        },
        data,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(260, data.length * 40 + 80) }}
    />
  );
}
