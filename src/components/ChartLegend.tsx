import { COLORS } from '../lib/colors';

const items = [
  { color: COLORS.green, label: '達標 / 區間內' },
  { color: COLORS.orange, label: '接近或偏低' },
  { color: COLORS.red, label: '未達標 / 超標' },
];

export default function ChartLegend() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        justifyContent: 'center',
        padding: '8px 0 4px',
        fontSize: 12,
        color: '#555',
      }}
    >
      {items.map((item) => (
        <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              backgroundColor: item.color,
              display: 'inline-block',
            }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
