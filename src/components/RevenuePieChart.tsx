import ReactECharts from 'echarts-for-react';
import type { StoreDetail, Store, Region, User } from '../types';
import { fmtNumber } from '../lib/format';

interface Props {
  details: StoreDetail[];
  stores: Store[];
  regions: Region[];
  user: User;
  onSliceClick?: (storeId?: string, regionId?: string) => void;
}

const PALETTE = [
  '#2E6E8E', '#1D9E75', '#EF9F27', '#378ADD', '#7B3FBE',
  '#E27A4A', '#3AADAD', '#9B6B00', '#E24B4A', '#6B8E23',
];

function fmtWan(v: number) {
  return v >= 10000 ? `${(v / 10000).toFixed(1)}萬` : fmtNumber(v);
}

export default function RevenuePieChart({ details, stores, regions, user, onSliceClick }: Props) {
  const storeMap  = Object.fromEntries(stores.map((s) => [s.id, s]));
  const regionMap = Object.fromEntries(regions.map((r) => [r.id, r]));

  type PieItem = { name: string; value: number; id: string; isRegion: boolean };
  let data: PieItem[];

  if (user.role === 'admin' || user.role === 'director') {
    const byRegion: Record<string, number> = {};
    details.forEach((d) => {
      const store = storeMap[d.storeId];
      if (!store) return;
      byRegion[store.regionId] = (byRegion[store.regionId] ?? 0) + d.revenue;
    });
    data = Object.entries(byRegion)
      .map(([regionId, revenue]) => ({
        name: regionMap[regionId]?.name ?? regionId,
        value: revenue,
        id: regionId,
        isRegion: true,
      }))
      .sort((a, b) => b.value - a.value);
  } else {
    data = details
      .map((d) => ({
        name: storeMap[d.storeId]?.name ?? d.storeId,
        value: d.revenue,
        id: d.storeId,
        isRegion: false,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value, percent }: { name: string; value: number; percent: number }) =>
        `<b>${name}</b><br/>營收：${fmtNumber(value)}<br/>占比：${percent.toFixed(1)}%`,
    },
    color: PALETTE,
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: '總營收',
          textAlign: 'center',
          fill: '#888',
          fontSize: 12,
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '50%',
        style: {
          text: fmtNumber(total),
          textAlign: 'center',
          fill: '#1F4E5F',
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['38%', '62%'],
        center: ['50%', '52%'],
        label: {
          show: true,
          position: 'outside',
          formatter: ({ name, value, percent }: { name: string; value: number; percent: number }) =>
            `${name}\n${fmtWan(value)}（${percent.toFixed(1)}%）`,
          fontSize: 12,
          lineHeight: 18,
          color: '#444',
        },
        labelLine: { show: true, length: 12, length2: 8 },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
          label: { fontWeight: 'bold', fontSize: 13 },
        },
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: PALETTE[i % PALETTE.length] },
        })),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(300, data.length * 48 + 60) }}
      onEvents={{
        click: ({ name }: { name: string }) => {
          if (!onSliceClick) return;
          const item = data.find((d) => d.name === name);
          if (!item) return;
          if (item.isRegion) onSliceClick(undefined, item.id);
          else onSliceClick(item.id, undefined);
        },
      }}
    />
  );
}
