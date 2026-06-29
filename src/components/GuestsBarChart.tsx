import ReactECharts from 'echarts-for-react';
import type { StoreMonthly, Store } from '../types';
import { COLORS } from '../lib/colors';

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

export default function GuestsBarChart({ data, stores, onBarClick }: Props) {
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  const items = data
    .map((d) => ({
      name: storeMap[d.storeId]?.name ?? d.storeId,
      storeId: d.storeId,
      guests: d.guests,
    }))
    .sort((a, b) => b.guests - a.guests);

  const rotate = labelRotate(items.length);

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 16, top: 32, bottom: rotate > 0 ? 64 : 40 },
    xAxis: {
      type: 'category',
      data: items.map((i) => i.name),
      axisLabel: { fontSize: 12, rotate },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: items.map((item) => ({
          value: item.guests,
          itemStyle: { color: COLORS.blue },
          label: {
            show: true,
            position: 'top',
            color: COLORS.blue,
            fontSize: 11,
            fontWeight: 600,
            formatter: () => String(item.guests),
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
