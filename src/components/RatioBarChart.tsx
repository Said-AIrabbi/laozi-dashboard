import ReactECharts from 'echarts-for-react';
import type { StoreMonthly, Store } from '../types';
import { bandColor } from '../lib/colors';

interface Props {
  data: StoreMonthly[];
  stores: Store[];
  field: 'foodCostPct' | 'laborCostPct';
  band: { min: number; max: number };
  onBarClick?: (storeId: string) => void;
}

function chartHeight(count: number) {
  return Math.max(260, count * 28);
}

function labelRotate(count: number) {
  if (count > 16) return 40;
  if (count > 10) return 20;
  return 0;
}

export default function RatioBarChart({ data, stores, field, band, onBarClick }: Props) {
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  const items = data
    .map((d) => {
      const val = d[field];
      return {
        name: storeMap[d.storeId]?.name ?? d.storeId,
        storeId: d.storeId,
        value: val,
        color: bandColor(val, band),
      };
    })
    .sort((a, b) => b.value - a.value);

  const maxVal = Math.max(...items.map((i) => i.value), band.max + 5);
  const rotate = labelRotate(items.length);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ name: string; value: number }>) =>
        `${params[0].name}：${params[0].value.toFixed(1)}%`,
    },
    grid: { left: 44, right: 16, top: 32, bottom: rotate > 0 ? 64 : 40 },
    xAxis: {
      type: 'category',
      data: items.map((i) => i.name),
      axisLabel: { fontSize: 12, rotate },
    },
    yAxis: {
      type: 'value',
      max: Math.ceil(maxVal + 2),
      axisLabel: {
        formatter: (v: number) => `${v}%`,
        fontSize: 11,
      },
    },
    series: [
      {
        type: 'bar',
        data: items.map((item) => ({
          value: item.value,
          itemStyle: { color: item.color },
          label: {
            show: true,
            position: 'top',
            color: item.color,
            fontSize: 11,
            fontWeight: 600,
            formatter: () => `${item.value.toFixed(1)}%`,
          },
        })),
        barMaxWidth: 48,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: 1.5 },
          label: { fontSize: 10, position: 'insideEndTop' },
          data: [
            {
              yAxis: band.max,
              lineStyle: { color: '#E24B4A' },
              label: { color: '#E24B4A', formatter: `上限 ${band.max}%` },
            },
            {
              yAxis: band.min,
              lineStyle: { color: '#EF9F27' },
              label: { color: '#EF9F27', formatter: `下限 ${band.min}%` },
            },
          ],
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: chartHeight(items.length) }}
      onEvents={{
        click: (params: { dataIndex: number }) => {
          const item = items[params.dataIndex];
          if (item && onBarClick) onBarClick(item.storeId);
        },
      }}
    />
  );
}
