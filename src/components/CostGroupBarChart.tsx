import ReactECharts from 'echarts-for-react';
import type { StoreDetail, Store } from '../types';
import { COLORS } from '../lib/colors';
import { fmtNumber } from '../lib/format';

interface Props {
  details: StoreDetail[];
  stores: Store[];
  foodBand: { min: number; max: number };
  laborBand: { min: number; max: number };
  onBarClick?: (storeId: string) => void;
}

export default function CostGroupBarChart({ details, stores, onBarClick }: Props) {
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  const items = details
    .map((d) => ({
      store: storeMap[d.storeId],
      storeId: d.storeId,
      foodAmt:  Math.round(d.revenue * d.foodCostPct  / 100),
      laborAmt: Math.round(d.revenue * d.laborCostPct / 100),
      foodPct:  d.foodCostPct,
      laborPct: d.laborCostPct,
    }))
    .filter((i) => i.store)
    .sort((a, b) => b.foodAmt - a.foodAmt);

  const storeNames = items.map((i) => i.store.name);
  const height = Math.max(220, items.length * 52);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ seriesName: string; name: string; value: number; dataIndex: number }>) => {
        const idx = params[0].dataIndex;
        const item = items[idx];
        return [
          `<b>${params[0].name}</b>`,
          `食材費用：${fmtNumber(item.foodAmt)}（占比 ${item.foodPct.toFixed(1)}%）`,
          `人事費用：${fmtNumber(item.laborAmt)}（占比 ${item.laborPct.toFixed(1)}%）`,
        ].join('<br/>');
      },
    },
    legend: {
      data: ['食材費用', '人事費用'],
      bottom: 4,
      textStyle: { fontSize: 12 },
    },
    grid: { left: 16, right: 16, top: 8, bottom: 36, containLabel: true },
    xAxis: {
      type: 'category',
      data: storeNames,
      axisLabel: { fontSize: 12, rotate: storeNames.length > 4 ? 30 : 0 },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (v: number) => `${(v / 10000).toFixed(0)}萬`,
        fontSize: 11,
      },
    },
    series: [
      {
        name: '食材費用',
        type: 'bar',
        barMaxWidth: 28,
        data: items.map((i) => ({
          value: i.foodAmt,
          itemStyle: { color: COLORS.primaryMid },
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            formatter: () => `${(i.foodAmt / 10000).toFixed(1)}萬`,
          },
        })),
      },
      {
        name: '人事費用',
        type: 'bar',
        barMaxWidth: 28,
        data: items.map((i) => ({
          value: i.laborAmt,
          itemStyle: { color: COLORS.green },
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            formatter: () => `${(i.laborAmt / 10000).toFixed(1)}萬`,
          },
        })),
      },
    ],
  };

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
