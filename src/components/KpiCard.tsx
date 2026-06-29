import { Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { deltaColor } from '../lib/colors';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  prevValue?: number | string;
  prevLabel?: string;
  positiveIsGood?: boolean;
  delta?: number;
  deltaLabel?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  subtitleColor,
  prevValue,
  prevLabel = '較上月',
  positiveIsGood = true,
  delta,
  deltaLabel,
}: KpiCardProps) {
  const showDelta = delta !== undefined;
  const color = showDelta ? deltaColor(delta, positiveIsGood) : '#666';
  const isPositive = (delta ?? 0) > 0;

  return (
    <Card
      size="small"
      style={{
        borderRadius: 10,
        border: '1px solid #e8edf2',
        background: '#fff',
        height: '100%',
      }}
      styles={{ body: { padding: '16px 18px' } }}
    >
      <div style={{ fontSize: 12, color: '#7a8a99', marginBottom: 4 }}>{title}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#1F4E5F',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 12,
            color: subtitleColor ?? '#7a8a99',
            marginTop: 2,
            fontWeight: subtitleColor ? 600 : 400,
          }}
        >
          {subtitle}
        </div>
      )}
      {showDelta && (
        <div style={{ marginTop: 8, fontSize: 12, color, fontVariantNumeric: 'tabular-nums' }}>
          {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {' '}
          {deltaLabel ?? `${prevLabel} ${String(prevValue)}`}
        </div>
      )}
    </Card>
  );
}
