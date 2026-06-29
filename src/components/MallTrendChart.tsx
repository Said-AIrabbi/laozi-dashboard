import ReactECharts from 'echarts-for-react';
import type { MallTrendPoint } from '../types';

interface MallTrendSeries {
  name: string;
  trend: MallTrendPoint[];
  color?: string;
}

interface Props {
  series: MallTrendSeries[];
}

const PALETTE = [
  '#2E6E8E', '#1D9E75', '#EF9F27', '#378ADD', '#7B3FBE', '#E27A4A',
];

export default function MallTrendChart({ series }: Props) {
  const labels = series[0]?.trend.map((t) => t.label) ?? [];

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ seriesName: string; value: number; name: string }>) =>
        `<b>${params[0]?.name}</b><br/>` +
        params.map((p) => `${p.seriesName}：${p.value.toFixed(1)}%`).join('<br/>'),
    },
    legend: {
      bottom: 4,
      left: 'center',
      textStyle: { fontSize: 11 },
      show: series.length > 1,
    },
    grid: {
      left: 12,
      right: 12,
      top: 16,
      bottom: series.length > 1 ? 48 : 28,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: {
        formatter: (v: number) => `${v}%`,
        fontSize: 11,
      },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: series.map((s, idx) => {
      const color = s.color ?? PALETTE[idx % PALETTE.length];
      const allZero = s.trend.every((t) => t.sharePct === 0);
      return {
        name: s.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color, width: 2, type: allZero ? 'dashed' : 'solid' },
        itemStyle: { color },
        label: {
          show: true,
          position: 'top',
          fontSize: 10,
          color,
          formatter: (p: { value: number; dataIndex: number }) =>
            p.dataIndex === labels.length - 1 ? `${p.value.toFixed(1)}%` : '',
        },
        data: s.trend.map((t) => t.sharePct),
      };
    }),
  };

  return <ReactECharts option={option} style={{ height: 260 }} />;
}
