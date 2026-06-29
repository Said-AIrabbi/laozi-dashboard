import ReactECharts from 'echarts-for-react';
import type { TrendPoint } from '../types';
import { COLORS } from '../lib/colors';
import { fmtWan } from '../lib/format';

interface Props {
  data: TrendPoint[];
}

export default function TrendChart({ data }: Props) {
  const lastIdx = data.length - 1;

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ name: string; value: number }>) =>
        `${params[0].name}：${fmtWan(params[0].value)}`,
    },
    grid: { left: 52, right: 16, top: 28, bottom: 36 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.label),
      axisLabel: { fontSize: 12 },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => fmtWan(v), fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        data: data.map((d, idx) => ({
          value: d.revenue,
          symbolSize: idx === lastIdx ? 9 : 5,
          itemStyle: { color: idx === lastIdx ? COLORS.primaryDark : COLORS.primaryMid },
          label: {
            show: true,
            position: 'top',
            color: idx === lastIdx ? COLORS.primaryDark : '#7a8a99',
            fontSize: 11,
            fontWeight: idx === lastIdx ? 700 : 400,
            formatter: () => fmtWan(d.revenue),
          },
        })),
        lineStyle: { color: COLORS.primaryMid, width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(46,110,142,0.25)' },
              { offset: 1, color: 'rgba(46,110,142,0.02)' },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 220 }} />;
}
