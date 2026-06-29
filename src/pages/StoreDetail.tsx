import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  Card,
  Row,
  Col,
  Table,
  Tabs,
  Typography,
  Space,
  Button,
  Input,
  InputNumber,
  message,
  Tag,
} from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { exportStoreDetailExcel } from '../lib/exportExcel';
import { useRole } from '../context/RoleContext';
import { dashboardService } from '../services/dashboardService';
import type { QualitativeReport, MetricCompare, ActivityCoupon, MallCompetitor } from '../types';
import { useSettings } from '../context/SettingsContext';
import { COLORS, achievementColor } from '../lib/colors';
import { fmtNumber, fmtPct, achievementRate } from '../lib/format';
import KpiCard from '../components/KpiCard';
import TrendChart from '../components/TrendChart';
import FoodCategoryChart from '../components/FoodCategoryChart';
import MallPieChart from '../components/MallPieChart';
import MallTrendChart from '../components/MallTrendChart';
import AppHeader from '../components/AppHeader';

const { Title, Text } = Typography;
const { TextArea } = Input;

/** Compact two-column key-value table reused across tabs */
function KvTable({ rows }: { rows: [string, string][] }) {
  return (
    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
      <tbody>
        {rows.map(([label, val]) => (
          <tr key={label} style={{ borderBottom: '1px solid #f0f4f8' }}>
            <td style={{ padding: '6px 4px', color: '#7a8a99', width: '55%' }}>{label}</td>
            <td
              style={{
                padding: '6px 4px',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {val}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StoreDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { currentUser: currentUserNullable } = useRole();
  const currentUser = currentUserNullable!;

  const store  = dashboardService.getStore(storeId ?? '');
  const detail = dashboardService.getStoreDetail(storeId ?? '');

  const [qualitative, setQualitative] = useState<QualitativeReport>(
    detail?.qualitative ?? {
      auditScore: 0,
      improvementPlan: '',
      staffing: '',
      equipment: '',
      performanceNote: '',
    },
  );
  const [mallCompetitors, setMallCompetitors] = useState<MallCompetitor[]>(
    detail?.mall.competitors ?? [],
  );
  const [messageApi, contextHolder] = message.useMessage();

  if (!store || !detail) {
    return <div style={{ padding: 40 }}>找不到門市資料</div>;
  }

  const { thresholds } = useSettings();
  const PERIOD = '2026年2月';
  const isManager        = currentUser.role === 'manager';
  const managerMultiStore = isManager && (currentUser.storeIds ?? []).length > 1;
  const showBackButton   = !isManager || managerMultiStore;
  const rate        = achievementRate(detail.revenue, detail.target);
  const rateDisplay = `${(rate * 100).toFixed(1)}%`;
  const foodOver    = detail.foodCostPct > thresholds.food.max;
  const achieveColor = achievementColor(rate);

  const prevRevenue = detail.analysis.find((a) => a.label === '營業額')?.prevMonth;
  const revDelta =
    typeof prevRevenue === 'number' ? detail.revenue - prevRevenue : undefined;

  const prevFoodPct = detail.analysis.find((a) => a.label === '食材占比')?.prevMonth;
  const foodDelta =
    typeof prevFoodPct === 'string' ? detail.foodCostPct - parseFloat(prevFoodPct) : undefined;

  const prevLaborPct = detail.analysis.find((a) => a.label === '人事占比')?.prevMonth;
  const laborDelta =
    typeof prevLaborPct === 'string' ? detail.laborCostPct - parseFloat(prevLaborPct) : undefined;

  const handleSave = () => { messageApi.success('店長填報已儲存'); };

  // ── Analysis table ───────────────────────────────────────────────
  const analysisColumns = [
    { title: '指標', dataIndex: 'label', key: 'label', width: 120 },
    {
      title: '本月',
      dataIndex: 'current',
      key: 'current',
      render: (val: number | string, row: MetricCompare) => {
        const isFood = row.label === '食材占比';
        const numVal = parseFloat(String(val));
        const over   = isFood && !isNaN(numVal) && numVal > thresholds.food.max;
        return (
          <span style={{ color: over ? COLORS.red : undefined, fontWeight: over ? 700 : 400 }}>
            {typeof val === 'number' ? fmtNumber(val) : val}
          </span>
        );
      },
    },
    {
      title: '上月',
      dataIndex: 'prevMonth',
      key: 'prevMonth',
      render: (val: number | string | undefined) =>
        val === undefined || val === '—'
          ? '—'
          : typeof val === 'number' ? fmtNumber(val) : val,
    },
    {
      title: '去年同期',
      dataIndex: 'lastYear',
      key: 'lastYear',
      render: (val: number | string | undefined) =>
        val === undefined || val === '—'
          ? '—'
          : typeof val === 'number' ? fmtNumber(val) : val,
    },
    {
      title: '原始（不含活動）',
      dataIndex: 'original',
      key: 'original',
      render: (val: number | string | undefined) =>
        val === undefined || val === '—'
          ? '—'
          : typeof val === 'number' ? fmtNumber(val) : val,
    },
  ];

  // ── Activity table ───────────────────────────────────────────────
  const activityColumns = [
    { title: '券別', dataIndex: 'name', key: 'name' },
    {
      title: '數量',
      dataIndex: 'qty',
      key: 'qty',
      align: 'right' as const,
      render: (v: number) => fmtNumber(v),
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (v: number) => fmtNumber(v),
    },
  ];

  const totalQty    = detail.activities.reduce((s, a) => s + a.qty, 0);
  const totalAmount = detail.activities.reduce((s, a) => s + a.amount, 0);
  const activityData: (ActivityCoupon & { key: string })[] = [
    ...detail.activities.map((a, i) => ({ ...a, key: String(i) })),
    { key: 'total', name: '合計', qty: totalQty, amount: totalAmount },
  ];

  const cardStyle = { borderRadius: 10, border: '1px solid #e8edf2' };
  const titleStyle: React.CSSProperties = { color: '#1F4E5F', fontWeight: 700 };

  // ── Tabs content ─────────────────────────────────────────────────
  const tabItems = [
    {
      key: 'member',
      label: '會員分析',
      children: (
        <KvTable
          rows={[
            ['會員總人數', fmtNumber(detail.member.total)],
            ['本月新增', fmtNumber(detail.member.newCount)],
            ['成長率', fmtPct(detail.member.growthPct)],
            ['會員消費金額', fmtNumber(detail.member.spend)],
            ['會員消費佔比', fmtPct(detail.member.spendPct)],
          ]}
        />
      ),
    },
    {
      key: 'activity',
      label: '活動商品分析',
      children: (
        <Table
          size="small"
          dataSource={activityData}
          columns={activityColumns}
          pagination={false}
          rowClassName={(row) => (row.key === 'total' ? 'table-row-total' : '')}
        />
      ),
    },
    {
      key: 'other',
      label: '其他項目',
      children: (
        <KvTable
          rows={[
            ['碎肉豬（kg）', String(detail.other.scrapPork)],
            ['碎肉牛（kg）', String(detail.other.scrapBeef)],
            ['員工餐（份）', fmtNumber(detail.other.staffMeals)],
            ...(detail.other.staffMealBreakdown
              ? ([
                  ['　↳ 梅豬', fmtNumber(detail.other.staffMealBreakdown.plumPork)],
                  ['　↳ 五花', fmtNumber(detail.other.staffMealBreakdown.belly)],
                  ['　↳ 牛花', fmtNumber(detail.other.staffMealBreakdown.beef)],
                ] as [string, string][])
              : []),
            ['作廢張數', `${fmtNumber(detail.other.voidCount)} 張`],
            ['作廢金額', fmtNumber(detail.other.voidAmount)],
            ['損耗蔬菜（kg）', String(detail.other.wasteVeg)],
          ]}
        />
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {contextHolder}
      <AppHeader />

      <div style={{ padding: '20px 24px' }}>
        {/* Breadcrumb */}
        {showBackButton && (
          <Breadcrumb
            style={{ marginBottom: 12 }}
            items={[
              {
                title: (
                  <span
                    style={{ cursor: 'pointer', color: COLORS.primaryMid }}
                    onClick={() => navigate('/')}
                  >
                    <ArrowLeftOutlined style={{ marginRight: 4 }} />
                    全店總覽
                  </span>
                ),
              },
              { title: store.name },
            ]}
          />
        )}

        {/* Title Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Title level={3} style={{ margin: 0, color: '#1F4E5F' }}>
            {store.name} · 月會議報表
          </Title>
          <Text style={{ color: '#7a8a99' }}>2026 年 2 月</Text>
          <Text style={{ color: '#7a8a99' }}>店長：{store.managerName}</Text>
          <div style={{ marginLeft: 'auto' }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => { void exportStoreDetailExcel(store, detail, PERIOD); }}
            >
              匯出 Excel
            </Button>
          </div>
        </div>

        {/* A: KPI Cards */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8} md={4}>
            <KpiCard
              title="營業額"
              value={fmtNumber(detail.revenue)}
              subtitle={`達成率 ${rateDisplay}`}
              subtitleColor={achieveColor}
              delta={revDelta}
              deltaLabel={revDelta !== undefined ? `較上月 ${revDelta > 0 ? '+' : ''}${fmtNumber(revDelta)}` : undefined}
              positiveIsGood
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <KpiCard
              title="來客數"
              value={fmtNumber(detail.guests)}
              delta={0}
              deltaLabel="較上月持平"
              positiveIsGood
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <KpiCard
              title="客單價"
              value={`${fmtNumber(detail.avgSpend)} 元`}
              delta={-3}
              deltaLabel="較上月 -3 元"
              positiveIsGood
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <KpiCard
              title="食材占比"
              value={fmtPct(detail.foodCostPct)}
              subtitle={
                foodOver
                  ? `· 超標（上限 ${thresholds.food.max}%）`
                  : `上限 ${thresholds.food.max}%`
              }
              subtitleColor={foodOver ? COLORS.red : '#7a8a99'}
              delta={foodDelta}
              deltaLabel={
                foodDelta !== undefined
                  ? `較上月 ${foodDelta > 0 ? '+' : ''}${foodDelta.toFixed(1)}%`
                  : undefined
              }
              positiveIsGood={false}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <KpiCard
              title="人事占比"
              value={fmtPct(detail.laborCostPct)}
              subtitle={`區間 ${thresholds.labor.min}–${thresholds.labor.max}%`}
              delta={laborDelta}
              deltaLabel={
                laborDelta !== undefined
                  ? `較上月 ${laborDelta > 0 ? '+' : ''}${laborDelta.toFixed(1)}%`
                  : undefined
              }
              positiveIsGood={false}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <KpiCard
              title="會員消費佔比"
              value={fmtPct(detail.memberSpendPct)}
              delta={1.2}
              deltaLabel="較上月 +1.2%"
              positiveIsGood
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* B: Trend Chart */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              title={<span style={titleStyle}>近 6 個月營業額趨勢</span>}
              style={cardStyle}
            >
              <TrendChart data={detail.trend} />
            </Card>
          </Col>

          {/* D: Food Category Chart */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              title={<span style={titleStyle}>食材類別占比（依品項分類）</span>}
              style={cardStyle}
            >
              <FoodCategoryChart data={detail.foodCategories} foodCostPct={detail.foodCostPct} />
            </Card>
          </Col>

          {/* C: Analysis Table */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              title={<span style={titleStyle}>營業分析比較表</span>}
              style={{ ...cardStyle, height: '100%' }}
            >
              <Table
                size="small"
                dataSource={detail.analysis.map((a, i) => ({ ...a, key: i }))}
                columns={analysisColumns}
                pagination={false}
                rowClassName={(_, idx) => (idx % 2 === 0 ? '' : 'table-row-alt')}
              />
              <div style={{ marginTop: 8, fontSize: 11, color: '#aaa' }}>
                ＊ 原始 = 不含活動折讓的還原值；去年同期首年無資料者顯示「—」
              </div>
            </Card>
          </Col>

          {/* E/F: Tabbed card — 會員 / 活動 / 其他 */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              style={{ ...cardStyle, height: '100%' }}
              bodyStyle={{ paddingTop: 0 }}
            >
              <Tabs
                defaultActiveKey="member"
                items={tabItems}
                tabBarStyle={{ marginBottom: 0 }}
              />
            </Card>
          </Col>

          {/* H: Mall Competition */}
          <Col xs={24}>
            <Card
              size="small"
              title={
                <Space>
                  <span style={titleStyle}>
                    商場競爭分析{store.mallName ? `（${store.mallName}）` : ''}
                  </span>
                  {!isManager && <Tag style={{ fontSize: 11 }}>由店長填寫競爭對手 · 唯讀</Tag>}
                </Space>
              }
              style={cardStyle}
            >
              <Row gutter={[16, 16]}>
                {/* Left: 6-month trend */}
                <Col xs={24} lg={12}>
                  <div style={{ fontSize: 12, color: '#7a8a99', marginBottom: 6 }}>
                    近 6 個月商場占比趨勢
                  </div>
                  <MallTrendChart
                    series={[{
                      name: store.name,
                      trend: detail.mall.trend,
                    }]}
                  />
                </Col>

                {/* Right: current month pie */}
                <Col xs={24} lg={12}>
                  <div style={{ fontSize: 12, color: '#7a8a99', marginBottom: 6 }}>
                    本月同商場餐飲占比
                  </div>
                  <MallPieChart
                    ownLabel={`荖子鍋${store.name}`}
                    ownRevenue={detail.revenue}
                    competitors={mallCompetitors}
                    mallName={store.mallName}
                  />
                </Col>
              </Row>

              {/* Manager editable competitor table */}
              {isManager && (
                <div style={{ marginTop: 16, borderTop: '1px solid #f0f4f8', paddingTop: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#555', marginBottom: 8 }}>
                    同商場競爭對手（本月）
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: '#7a8a99', fontWeight: 400, borderBottom: '1px solid #e8edf2' }}>餐廳名稱</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', color: '#7a8a99', fontWeight: 400, borderBottom: '1px solid #e8edf2' }}>本月營收（元）</th>
                        <th style={{ width: 48, borderBottom: '1px solid #e8edf2' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {mallCompetitors.map((c, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f0f4f8' }}>
                          <td style={{ padding: '4px 8px' }}>
                            <Input
                              size="small"
                              value={c.name}
                              onChange={(e) =>
                                setMallCompetitors((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, name: e.target.value } : item,
                                  ),
                                )
                              }
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td style={{ padding: '4px 8px' }}>
                            <InputNumber
                              size="small"
                              min={0}
                              value={c.revenue}
                              onChange={(v) =>
                                setMallCompetitors((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, revenue: v ?? 0 } : item,
                                  ),
                                )
                              }
                              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={(v) => parseInt((v ?? '').replace(/,/g, ''), 10) as unknown as 0}
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                setMallCompetitors((prev) => prev.filter((_, i) => i !== idx))
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() =>
                        setMallCompetitors((prev) => [...prev, { name: '', revenue: 0 }])
                      }
                    >
                      新增競爭對手
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      style={{ background: COLORS.primaryDark }}
                      onClick={() => messageApi.success('商場競爭資料已儲存')}
                    >
                      儲存
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </Col>

          {/* G: Qualitative Report */}
          <Col xs={24}>
            <Card
              size="small"
              title={
                <Space>
                  <span style={titleStyle}>店長填報</span>
                  {!isManager && <Tag style={{ fontSize: 11 }}>由店長填寫 · 唯讀</Tag>}
                </Space>
              }
              style={cardStyle}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={4}>
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ fontSize: 12, color: '#7a8a99', marginBottom: 4 }}>SGS稽核分數</div>
                    <div
                      style={{
                        fontSize: 48,
                        fontWeight: 800,
                        color:
                          qualitative.auditScore >= 90
                            ? COLORS.green
                            : qualitative.auditScore >= 80
                            ? COLORS.orange
                            : COLORS.red,
                        lineHeight: 1.1,
                      }}
                    >
                      {isManager ? (
                        <InputNumber
                          min={0}
                          max={100}
                          value={qualitative.auditScore}
                          onChange={(v) =>
                            setQualitative((q) => ({ ...q, auditScore: v ?? 0 }))
                          }
                          style={{ width: 80, fontSize: 32, fontWeight: 800 }}
                        />
                      ) : (
                        qualitative.auditScore
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa' }}>/ 100</div>
                  </div>
                </Col>

                <Col xs={24} sm={20}>
                  <Row gutter={[12, 12]}>
                    {(
                      [
                        { key: 'improvementPlan', label: '改善方案' },
                        { key: 'staffing',        label: '人員配置' },
                        { key: 'equipment',       label: '設備回報' },
                        { key: 'performanceNote', label: '本月業績分析' },
                      ] as const
                    ).map(({ key, label }) => (
                      <Col xs={24} sm={12} key={key}>
                        <div style={{ fontSize: 12, color: '#7a8a99', marginBottom: 4 }}>
                          {label}
                        </div>
                        {isManager ? (
                          <TextArea
                            rows={3}
                            value={qualitative[key]}
                            onChange={(e) =>
                              setQualitative((q) => ({ ...q, [key]: e.target.value }))
                            }
                            style={{ fontSize: 13 }}
                          />
                        ) : (
                          <div
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e8edf2',
                              borderRadius: 6,
                              padding: '8px 10px',
                              fontSize: 13,
                              minHeight: 72,
                              color: '#333',
                              lineHeight: 1.6,
                            }}
                          >
                            {qualitative[key] || '—'}
                          </div>
                        )}
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>

              {isManager && (
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    style={{ background: COLORS.primaryDark }}
                    onClick={handleSave}
                  >
                    儲存填報
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
