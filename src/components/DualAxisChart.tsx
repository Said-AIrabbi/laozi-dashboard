import ReactECharts from 'echarts-for-react';
import type { StoreDetail, Store } from '../types';
import { COLORS } from '../lib/colors';

interface Props {
  details: StoreDetail[];
  stores: Store[];
  /** Primary metric → bar (left Y-axis) */
  getBar: (d: StoreDetail) => number;
  barLabel: string;
  formatBar?: (v: number) => string;
  barColor?: string;
  /** Secondary metric → line (right Y-axis, %) */
  getLine: (d: StoreDetail) => number;
  lineLabel: string;
  formatLine?: (v: number) => string;
  lineColor?: string;
  rightAxisUnit?: string;
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

export default function DualAxisChart({
  details,
  stores,
  getBar,
  barLabel,
  formatBar,
  barColor = COLORS.green,
  getLine,
  lineLabel,
  formatLine,
  lineColor = COLORS.orange,
  rightAxisUnit = '%',
  onBarClick,
}: Props) {
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

  const items = details
    .map((d) => ({
      name: storeMap[d.storeId]?.name ?? d.storeId,
      storeId: d.storeId,
      bar: getBar(d),
      line: getLine(d),
    }))
    .sort((a, b) => b.bar - a.bar);

  const rotate = labelRotate(items.length);

  const fmtB = formatBar  ?? ((v: number) => String(v));
  const fmtL = formatLine ?? ((v: number) => `${v.toFixed(1)}${rightAxisUnit}`);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: Array<{ seriesName: string; value: number; name: string }>) => {
        const name = params[0]?.name ?? '';
        return params
          .map((p) =>
            `${name}<br/>${p.seriesName}：${
              p.seriesName === barLabel ? fmtB(p.value) : fmtL(p.value)
            }`,
          )
          .join('<br/>');
      },
    },
    legend: { bottom: 4, left: 'center', textStyle: { fontSize: 12 } },
    grid: { left: 56, right: 56, top: 28, bottom: rotate > 0 ? 80 : 52 },
    xAxis: {
      type: 'category',
      data: items.map((i) => i.name),
      axisLabel: { fontSize: 12, rotate },
    },
    yAxis: [
      {
        type: 'value',
        name: barLabel,
        nameTextStyle: { fontSize: 10 },
        axisLabel: { formatter: fmtB, fontSize: 11 },
        alignTicks: true,
        min: 0,
      },
      {
        type: 'value',
        name: lineLabel,
        nameTextStyle: { fontSize: 10 },
        axisLabel: { formatter: (v: number) => `${v}${rightAxisUnit}`, fontSize: 11 },
        alignTicks: true,
        min: 0,
      },
    ],
    series: [
      {
        name: barLabel,
        type: 'bar',
        yAxisIndex: 0,
        barMaxWidth: 48,
        data: items.map((item) => ({
          value: item.bar,
          itemStyle: { color: barColor },
          label: {
            show: true,
            position: 'top',
            color: barColor,
            fontSize: 11,
            fontWeight: 600,
            formatter: () => fmtB(item.bar),
          },
        })),
      },
      {
        name: lineLabel,
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: lineColor, width: 2 },
        itemStyle: { color: lineColor },
        label: {
          show: true,
          position: 'top',
          color: lineColor,
          fontSize: 10,
          formatter: (p: { value: number }) => fmtL(p.value),
        },
        data: items.map((item) => item.line),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: chartHeight(items.length) }}
      onEvents={{
        click: (params: { seriesType: string; dataIndex: number }) => {
          if (params.seriesType === 'bar') {
            const item = items[params.dataIndex];
            if (item && onBarClick) onBarClick(item.storeId);
          }
        },
      }}
    />
  );
}
