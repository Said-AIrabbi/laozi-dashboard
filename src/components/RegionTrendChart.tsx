import ReactECharts from 'echarts-for-react';
import type { StoreDetail, Store, Region, User } from '../types';

interface Props {
  details: StoreDetail[];
  stores: Store[];
  regions: Region[];
  user: User;
}

const PALETTE = [
  '#2E6E8E', '#1D9E75', '#EF9F27', '#378ADD', '#7B3FBE',
  '#E27A4A', '#3AADAD', '#9B6B00', '#E24B4A', '#6B8E23',
];

function fmtWan(v: number) {
  return `${(v / 10000).toFixed(1)}萬`;
}

export default function RegionTrendChart({ details, stores, regions, user }: Props) {
  const storeMap  = Object.fromEntries(stores.map((s) => [s.id, s]));
  const regionMap = Object.fromEntries(regions.map((r) => [r.id, r]));

  // Collect all trend labels in order from first available detail
  const labels = details[0]?.trend.map((t) => t.label) ?? [];

  type SeriesItem = { name: string; data: number[] };
  let series: SeriesItem[];

  if (user.role === 'admin' || user.role === 'director') {
    // Aggregate by region
    const byRegion: Record<string, number[]> = {};
    details.forEach((d) => {
      const store = storeMap[d.storeId];
      if (!store) return;
      const rid = store.regionId;
      if (!byRegion[rid]) byRegion[rid] = new Array(labels.length).fill(0);
      d.trend.forEach((t, i) => { byRegion[rid][i] += t.revenue; });
    });
    series = Object.entries(byRegion).map(([rid, data]) => ({
      name: regionMap[rid]?.name ?? rid,
      data,
    }));
  } else {
    // Each store as its own line
    series = details
      .filter((d) => storeMap[d.storeId])
      .map((d) => ({
        name: storeMap[d.storeId].name,
        data: d.trend.map((t) => t.revenue),
      }));
  }

  // Sort series by last value descending so legend order matches chart
  series.sort((a, b) => (b.data.at(-1) ?? 0) - (a.data.at(-1) ?? 0));

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ seriesName: string; value: number; name: string }>) =>
        `<b>${params[0].name}</b><br/>` +
        params.map((p) => `${p.seriesName}：${fmtWan(p.value)}`).join('<br/>'),
    },
    legend: {
      bottom: 4,
      left: 'center',
      textStyle: { fontSize: 12 },
    },
    grid: { left: 12, right: 12, top: 16, bottom: 48, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => fmtWan(v), fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    color: PALETTE,
    series: series.map((s, idx) => ({
      name: s.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: PALETTE[idx % PALETTE.length], width: 2 },
      itemStyle: { color: PALETTE[idx % PALETTE.length] },
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        color: PALETTE[idx % PALETTE.length],
        formatter: (p: { value: number; dataIndex: number }) =>
          p.dataIndex === labels.length - 1 ? fmtWan(p.value) : '',
      },
      data: s.data,
    })),
  };

  return <ReactECharts option={option} style={{ height: 300 }} />;
}
