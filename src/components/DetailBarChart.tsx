import ReactECharts from 'echarts-for-react';
import type { StoreDetail, Store } from '../types';
import { COLORS } from '../lib/colors';

interface Props {
  details: StoreDetail[];
  stores: Store[];
  getValue: (d: StoreDetail) => number;
  /** Label shown on top of each bar */
  formatLabel?: (v: number) => string;
  /** Tooltip value string */
  formatTooltip?: (v: number) => string;
  /** Per-bar colour (default blue) */
  getColor?: (v: number) => string;
  /** Y axis tick formatter */
  yAxisFormatter?: (v: number) => string;
  onBarClick?: (storeId: string) => void;
}

function chartHeight(count: number) {
  return Math.max(240, count * 28);
}
function labelRotate(count: number) {
  if (count > 16) return 40;
  if (count > 10) return 20;
  return 0;
}

export default function DetailBarChart({
  details,
  stores,
  getValue,
  formatLabel,
  formatTooltip,
  getColor,
  yAxisFormatter,
  onBarClick,
}: Props) {
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));
  const items = details
    .map((d) => {
      const v = getValue(d);
      return {
        name: storeMap[d.storeId]?.name ?? d.storeId,
        storeId: d.storeId,
        value: v,
        color: getColor ? getColor(v) : COLORS.blue,
        label: formatLabel ? formatLabel(v) : String(v),
      };
    })
    .sort((a, b) => b.value - a.value);

  const rotate = labelRotate(items.length);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ name: string; value: number }>) => {
        const v = params[0].value;
        return `${params[0].name}：${formatTooltip ? formatTooltip(v) : String(v)}`;
      },
    },
    grid: { left: 52, right: 16, top: 28, bottom: rotate > 0 ? 64 : 36 },
    xAxis: {
      type: 'category',
      data: items.map((i) => i.name),
      axisLabel: { fontSize: 12, rotate },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: yAxisFormatter ?? ((v: number) => String(v)),
        fontSize: 11,
      },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 48,
        data: items.map((item) => ({
          value: item.value,
          itemStyle: { color: item.color },
          label: {
            show: true,
            position: 'top',
            color: item.color,
            fontSize: 11,
            fontWeight: 600,
            formatter: () => item.label,
          },
        })),
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
