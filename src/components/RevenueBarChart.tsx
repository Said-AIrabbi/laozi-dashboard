import ReactECharts from 'echarts-for-react';
import type { StoreMonthly, Store } from '../types';
import { achievementColor } from '../lib/colors';
import { achievementRate, fmtWan, fmtNumber } from '../lib/format';

interface Props {
  data: StoreMonthly[];
  stores: Store[];
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

export default function RevenueBarChart({ data, stores, onBarClick }: Props) {
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  const items = data
    .map((d) => ({
      name: storeMap[d.storeId]?.name ?? d.storeId,
      storeId: d.storeId,
      revenue: d.revenue,
      rate: achievementRate(d.revenue, d.target),
      color: achievementColor(achievementRate(d.revenue, d.target)),
      rateLabel: `${(achievementRate(d.revenue, d.target) * 100).toFixed(1)}%`,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const rotate = labelRotate(items.length);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ name: string; value: number; dataIndex: number }>) => {
        const p = params[0];
        const item = items[p.dataIndex];
        return `${p.name}<br/>營業額：${fmtNumber(p.value)}<br/>達成率：${item.rateLabel}`;
      },
    },
    grid: { left: 48, right: 16, top: 32, bottom: rotate > 0 ? 64 : 40 },
    xAxis: {
      type: 'category',
      data: items.map((i) => i.name),
      axisLabel: { fontSize: 12, rotate },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (v: number) => fmtWan(v),
        fontSize: 11,
      },
    },
    series: [
      {
        type: 'bar',
        data: items.map((item) => ({
          value: item.revenue,
          itemStyle: { color: item.color },
          label: {
            show: true,
            position: 'top',
            color: item.color,
            fontSize: 11,
            fontWeight: 600,
            formatter: () => item.rateLabel,
          },
        })),
        barMaxWidth: 48,
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
