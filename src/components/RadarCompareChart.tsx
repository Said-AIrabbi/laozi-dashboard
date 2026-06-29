import { useState, useMemo } from 'react';
import { Select, Space } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { StoreDetail, Store } from '../types';

interface Props {
  details: StoreDetail[];
  stores: Store[];
}

const DIMS = ['業績達成率', '來客數', '客單價', '食材控制', '人事控制', '會員佔比'];
const COLOR_A = '#2E6E8E';
const COLOR_B = '#E27A4A';

function getRaw(d: StoreDetail): number[] {
  const achievementRate = d.target > 0 ? (d.revenue / d.target) * 100 : 0;
  return [
    achievementRate,
    d.guests,
    d.avgSpend,
    Math.max(0, 100 - d.foodCostPct),
    Math.max(0, 100 - d.laborCostPct),
    d.memberSpendPct,
  ];
}

export default function RadarCompareChart({ details, stores }: Props) {
  const [storeAId, setStoreAId] = useState<string>(stores[0]?.id ?? '');
  const [storeBId, setStoreBId] = useState<string>(stores[1]?.id ?? stores[0]?.id ?? '');

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));
  const detailMap = Object.fromEntries(details.map((d) => [d.storeId, d]));

  const maxValues = useMemo(() => {
    const allRaws = details.map(getRaw);
    return DIMS.map((_, i) => Math.max(...allRaws.map((r) => r[i]), 1));
  }, [details]);

  function normalize(d: StoreDetail): number[] {
    return getRaw(d).map((v, i) => Math.round((v / maxValues[i]) * 100));
  }

  const detailA = storeAId ? detailMap[storeAId] : null;
  const detailB = storeBId ? detailMap[storeBId] : null;

  const seriesData = [
    detailA ? { name: storeMap[storeAId]?.name ?? '', value: normalize(detailA) } : null,
    detailB ? { name: storeMap[storeBId]?.name ?? '', value: normalize(detailB) } : null,
  ].filter((x): x is { name: string; value: number[] } => x !== null);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number[] }) =>
        `<b>${params.name}</b><br/>` +
        DIMS.map((dim, i) => `${dim}：${params.value[i]}`).join('<br/>'),
    },
    legend: {
      data: seriesData.map((s) => s.name),
      bottom: 4,
      textStyle: { fontSize: 12 },
    },
    radar: {
      indicator: DIMS.map((name) => ({ name, max: 100 })),
      center: ['50%', '50%'],
      radius: '60%',
      axisName: { fontSize: 11, color: '#555' },
      splitNumber: 4,
      splitArea: {
        areaStyle: {
          color: [
            'rgba(46,110,142,0.04)',
            'rgba(46,110,142,0.02)',
            'rgba(46,110,142,0.04)',
            'rgba(46,110,142,0.02)',
          ],
        },
      },
      splitLine: { lineStyle: { color: '#dde3ea' } },
      axisLine: { lineStyle: { color: '#dde3ea' } },
    },
    series: [
      {
        type: 'radar',
        data: seriesData.map((s, idx) => ({
          name: s.name,
          value: s.value,
          lineStyle: { color: idx === 0 ? COLOR_A : COLOR_B, width: 2 },
          areaStyle: { color: idx === 0 ? 'rgba(46,110,142,0.15)' : 'rgba(226,122,74,0.15)' },
          itemStyle: { color: idx === 0 ? COLOR_A : COLOR_B },
          symbol: 'circle',
          symbolSize: 5,
        })),
      },
    ],
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'center', padding: '8px 0' }}>
        <Select
          value={storeAId}
          onChange={setStoreAId}
          options={storeOptions}
          style={{ width: 110 }}
          size="small"
        />
        <span style={{ color: '#999', fontSize: 12 }}>vs</span>
        <Select
          value={storeBId}
          onChange={setStoreBId}
          options={storeOptions}
          style={{ width: 110 }}
          size="small"
        />
      </Space>
      <ReactECharts option={option} style={{ height: 260 }} />
      <div style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 2 }}>
        各維度以全店最高值為基準（100 分）
      </div>
    </div>
  );
}
