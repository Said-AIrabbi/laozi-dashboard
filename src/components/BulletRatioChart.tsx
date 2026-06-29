import ReactECharts from 'echarts-for-react';
import type { StoreDetail, Store } from '../types';
import { COLORS, bandColor } from '../lib/colors';

interface Props {
  details: StoreDetail[];
  stores: Store[];
  getValue: (d: StoreDetail) => number;
  band: { min: number; max: number };
  onBarClick?: (storeId: string) => void;
}

export default function BulletRatioChart({ details, stores, getValue, band, onBarClick }: Props) {
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  const items = details
    .map((d) => ({ store: storeMap[d.storeId], value: getValue(d), storeId: d.storeId }))
    .filter((i) => i.store)
    .sort((a, b) => b.value - a.value);

  const upperBound = Math.ceil(Math.max(band.max * 1.6, Math.max(...items.map((i) => i.value)) * 1.15));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value }: { name: string; value: number }) =>
        `${name}：${(value as number).toFixed(1)}%<br/>門檻：${band.min}% – ${band.max}%`,
    },
    grid: { left: 16, right: 56, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      min: 0,
      max: upperBound,
      axisLabel: { formatter: (v: number) => `${v}%`, fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.store.name),
      axisLabel: { fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 14,
        data: items.map((i) => ({
          value: i.value,
          itemStyle: { color: bandColor(i.value, band), borderRadius: [0, 3, 3, 0] },
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            color: '#444',
            formatter: () => `${i.value.toFixed(1)}%`,
          },
        })),
        markArea: {
          silent: true,
          data: [
            [
              { xAxis: 0,        itemStyle: { color: 'rgba(239,159,39,0.10)' } },
              { xAxis: band.min },
            ],
            [
              { xAxis: band.min, itemStyle: { color: 'rgba(29,158,117,0.13)' } },
              { xAxis: band.max },
            ],
            [
              { xAxis: band.max, itemStyle: { color: 'rgba(226,74,74,0.10)' } },
              { xAxis: upperBound },
            ],
          ],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: 1.5 },
          label: { fontSize: 11 },
          data: [
            {
              xAxis: band.min,
              lineStyle: { color: COLORS.orange },
              label: { formatter: `${band.min}%`, color: COLORS.orange },
            },
            {
              xAxis: band.max,
              lineStyle: { color: COLORS.red },
              label: { formatter: `${band.max}%`, color: COLORS.red },
            },
          ],
        },
      },
    ],
  };

  const height = Math.max(200, items.length * 34);

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      onEvents={{
        click: ({ name }: { name: string }) => {
          const item = items.find((i) => i.store.name === name);
          if (item && onBarClick) onBarClick(item.storeId);
        },
      }}
    />
  );
}
