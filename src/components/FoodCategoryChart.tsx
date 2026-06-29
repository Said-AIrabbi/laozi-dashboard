import ReactECharts from 'echarts-for-react';
import type { FoodCategoryPct } from '../types';
import { COLORS } from '../lib/colors';

interface Props {
  data: FoodCategoryPct[];
  foodCostPct: number;
}

const PIE_COLORS = [
  COLORS.primaryDark,
  COLORS.primaryMid,
  COLORS.green,
  COLORS.blue,
  COLORS.orange,
  COLORS.lightGreen,
];

export default function FoodCategoryChart({ data, foodCostPct }: Props) {
  // Convert revenue-based pct → within-food pct
  const items = data.map((d) => ({
    category: d.category,
    withinFood: foodCostPct > 0 ? (d.pct / foodCostPct) * 100 : 0,
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value }: { name: string; value: number }) =>
        `${name}：佔食材 ${value.toFixed(1)}%`,
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'center',
      textStyle: { fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['38%', '70%'],
        center: ['38%', '50%'],
        data: items.map((d, i) => ({
          name: d.category,
          value: +d.withinFood.toFixed(1),
          itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] },
        })),
        label: {
          show: true,
          formatter: ({ name, value }: { name: string; value: number }) =>
            `${name}\n${value.toFixed(1)}%`,
          fontSize: 11,
          lineHeight: 16,
        },
        labelLine: { length: 10, length2: 8 },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 220 }} />;
}
