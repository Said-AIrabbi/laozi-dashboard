import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Row, Col, Button, Space, Divider, Typography, Tabs } from 'antd';
import { useRole } from '../context/RoleContext';
import { dashboardService } from '../services/dashboardService';
import { getLockedRegionIds } from '../lib/permissions';
import type { StoreDetail, StoreMonthly, Store } from '../types';
import { useSettings } from '../context/SettingsContext';
import AppHeader from '../components/AppHeader';
import RevenueBarChart from '../components/RevenueBarChart';
import GuestsBarChart from '../components/GuestsBarChart';
import BulletRatioChart from '../components/BulletRatioChart';
import ChartLegend from '../components/ChartLegend';
import DetailBarChart from '../components/DetailBarChart';
import DualAxisChart from '../components/DualAxisChart';
import CostGroupBarChart from '../components/CostGroupBarChart';
import RevenuePieChart from '../components/RevenuePieChart';
import RegionTrendChart from '../components/RegionTrendChart';
import OverviewMetricsTable from '../components/OverviewMetricsTable';
import MallPieChart from '../components/MallPieChart';
import MallTrendChart from '../components/MallTrendChart';
import { fmtNumber, fmtPct } from '../lib/format';
import { COLORS } from '../lib/colors';
import { exportOverviewExcel } from '../lib/exportExcel';
import { DownloadOutlined } from '@ant-design/icons';

const { Text } = Typography;


function anaVal(d: StoreDetail, label: string): number {
  const v = d.analysis.find((a) => a.label === label)?.current;
  return typeof v === 'number' ? v : parseFloat(String(v ?? '0')) || 0;
}

function MallOverviewSection({
  sortedDetails,
  filteredStoreObjects,
  mallStoreId,
  setMallStoreId,
  cardStyle,
  titleStyle,
}: {
  sortedDetails: StoreDetail[];
  filteredStoreObjects: Store[];
  mallStoreId: string;
  setMallStoreId: (id: string) => void;
  cardStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
}) {
  const storeOptions = filteredStoreObjects.map((s) => ({
    value: s.id,
    label: s.mallName ? `${s.name}（${s.mallName}）` : s.name,
  }));

  const effectiveId = mallStoreId || (filteredStoreObjects[0]?.id ?? '');
  const selectedStore = filteredStoreObjects.find((s) => s.id === effectiveId);
  const selectedDetail = sortedDetails.find((d) => d.storeId === effectiveId);

  return (
    <Card
      size="small"
      title={
        <Space size={12}>
          <span style={titleStyle}>商場競爭占比</span>
          <Select
            size="small"
            value={effectiveId}
            onChange={setMallStoreId}
            options={storeOptions}
            style={{ width: 200 }}
          />
        </Space>
      }
      style={cardStyle}
    >
      {selectedDetail && selectedStore ? (
        <Row gutter={[16, 0]}>
          <Col xs={24} lg={12}>
            <div style={{ fontSize: 12, color: '#7a8a99', marginBottom: 6 }}>
              近 6 個月商場占比趨勢
            </div>
            <MallTrendChart
              key={effectiveId}
              series={[{ name: selectedStore.name, trend: selectedDetail.mall.trend }]}
            />
          </Col>
          <Col xs={24} lg={12}>
            <div style={{ fontSize: 12, color: '#7a8a99', marginBottom: 6 }}>
              本月同商場競爭對手占比
            </div>
            <MallPieChart
              key={effectiveId}
              ownLabel={`荖子鍋${selectedStore.name}`}
              ownRevenue={selectedDetail.revenue}
              competitors={selectedDetail.mall.competitors}
              mallName={selectedStore.mallName}
            />
          </Col>
        </Row>
      ) : (
        <div style={{ padding: 40, textAlign: 'center', color: '#bbb' }}>無門市資料</div>
      )}
    </Card>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const { thresholds } = useSettings();
  const { currentUser: currentUserNullable } = useRole();
  const currentUser = currentUserNullable!;

  const regions = dashboardService.getRegions();
  const periods  = dashboardService.getPeriods();
  const lockedRegionIds = getLockedRegionIds(currentUser);

  const [period,      setPeriod]      = useState('2026-02');
  const [regionId,    setRegionId]    = useState<string>(
    lockedRegionIds.length > 0 ? lockedRegionIds[0] : 'all',
  );
  const [mallStoreId, setMallStoreId] = useState<string>('');
  const effectiveRegionId = lockedRegionIds.length > 0 ? lockedRegionIds[0] : regionId;
  const allMonthly    = dashboardService.getMonthlyData(period, currentUser);
  const visibleStores = dashboardService.getVisibleStores(currentUser);

  const filtered = useMemo(() => {
    let rows = allMonthly;
    if (effectiveRegionId !== 'all') {
      const ids = visibleStores
        .filter((s) => s.regionId === effectiveRegionId)
        .map((s) => s.id);
      rows = rows.filter((r) => ids.includes(r.storeId));
    }
    return rows;
  }, [allMonthly, effectiveRegionId, visibleStores]);

  const handleBarClick = (storeId: string) => navigate(`/store/${storeId}`);

  const filteredStoreObjects = visibleStores.filter((s) =>
    filtered.some((r: StoreMonthly) => r.storeId === s.id),
  );

  // Keep same x-axis order as the 4 main charts
  const allDetails = dashboardService.getVisibleDetails(currentUser);
  const sortedDetails = filtered
    .map((m) => allDetails.find((d) => d.storeId === m.storeId))
    .filter((d): d is StoreDetail => d !== undefined);

  const periodOptions = periods.map((p) => {
    const [y, m] = p.split('-');
    return { value: p, label: `${y} 年 ${parseInt(m)} 月` };
  });

  const regionOptions = [
    ...(lockedRegionIds.length === 0 ? [{ value: 'all', label: '全部區域' }] : []),
    ...regions
      .filter((r) => lockedRegionIds.length === 0 || lockedRegionIds.includes(r.id))
      .map((r) => ({ value: r.id, label: r.name })),
  ];

  const cardStyle = { borderRadius: 10, border: '1px solid #e8edf2' };
  const titleStyle: React.CSSProperties = { color: '#1F4E5F', fontWeight: 700 };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <AppHeader />

      {/* Filter Bar */}
      <div
        style={{
          background: '#fff',
          padding: '12px 24px',
          borderBottom: '1px solid #e8edf2',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Space wrap>
          <Text style={{ fontSize: 13 }}>期間</Text>
          <Select value={period} onChange={setPeriod} options={periodOptions} style={{ width: 130 }} />
          <Text style={{ fontSize: 13 }}>區域</Text>
          <Select
            value={effectiveRegionId}
            onChange={(v) => !lockedRegionIds.length && setRegionId(v)}
            options={regionOptions}
            style={{ width: 120 }}
            disabled={lockedRegionIds.length > 0}
          />
          <Button disabled style={{ color: '#aaa', fontSize: 12 }}>
            匯入報表（正式版功能）
          </Button>
        </Space>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {(currentUser.role !== 'manager' || (currentUser.storeIds?.length ?? 0) > 1) && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <span style={titleStyle}>
                    {(currentUser.role === 'admin' || currentUser.role === 'director') ? '各區域近半年營業額趨勢' : '門市近半年營業額趨勢'}
                  </span>
                }
                style={{ ...cardStyle, height: '100%' }}
              >
                <RegionTrendChart
                  details={sortedDetails}
                  stores={filteredStoreObjects}
                  regions={regions}
                  user={currentUser}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <span style={titleStyle}>
                    {(currentUser.role === 'admin' || currentUser.role === 'director') ? '各區域營收占比' : '區域門市營收占比'}
                  </span>
                }
                style={{ ...cardStyle, height: '100%' }}
              >
                <RevenuePieChart
                  details={sortedDetails}
                  stores={filteredStoreObjects}
                  regions={regions}
                  user={currentUser}
                  onSliceClick={(storeId) => { if (storeId) handleBarClick(storeId); }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Row gutter={[16, 16]}>
          {/* ── 主要圖表 ────────────────────────────── */}
          <Col xs={24}>
            <Card size="small" title={<span style={titleStyle}>營業額（達成率上色，頂端標達成率）</span>} style={cardStyle}>
              <RevenueBarChart data={filtered} stores={filteredStoreObjects} onBarClick={handleBarClick} />
            </Card>
          </Col>
          <Col xs={24}>
            <Card size="small" title={<span style={titleStyle}>來客數</span>} style={cardStyle}>
              <GuestsBarChart data={filtered} stores={filteredStoreObjects} onBarClick={handleBarClick} />
            </Card>
          </Col>
          <Col xs={24}>
            <Card
              size="small"
              title={<span style={titleStyle}>食材 / 人事占比</span>}
              style={cardStyle}
              bodyStyle={{ paddingTop: 0 }}
            >
              <Tabs
                defaultActiveKey="food"
                tabBarStyle={{ marginBottom: 0 }}
                items={[
                  {
                    key: 'food',
                    label: `食材占比（${thresholds.food.min}–${thresholds.food.max}%）`,
                    children: (
                      <BulletRatioChart
                        details={sortedDetails}
                        stores={filteredStoreObjects}
                        getValue={(d) => d.foodCostPct}
                        band={thresholds.food}
                        onBarClick={handleBarClick}
                      />
                    ),
                  },
                  {
                    key: 'labor',
                    label: `人事占比（${thresholds.labor.min}–${thresholds.labor.max}%）`,
                    children: (
                      <BulletRatioChart
                        details={sortedDetails}
                        stores={filteredStoreObjects}
                        getValue={(d) => d.laborCostPct}
                        band={thresholds.labor}
                        onBarClick={handleBarClick}
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0 4px' }} />
        <ChartLegend />
        <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: '#aaa' }}>
          點擊長條或分店名稱可進入單店月會議報表
        </div>

        {/* ── 補充直條圖（3 個頁籤區塊） ──────────────────────── */}
        <Divider style={{ margin: '20px 0 12px' }}>
          <Text style={{ fontSize: 12, color: '#aaa' }}>補充指標</Text>
        </Divider>

        <Row gutter={[16, 16]}>
          {/* ① 費用 · 客單 · 午間 */}
          <Col xs={24}>
            <Card size="small" title={<span style={titleStyle}>費用 · 客單 · 午間</span>} style={cardStyle} bodyStyle={{ paddingTop: 0 }}>
              <Tabs defaultActiveKey="costGroup" tabBarStyle={{ marginBottom: 0 }} items={[
                {
                  key: 'costGroup', label: '食材 & 人事費用',
                  children: <CostGroupBarChart details={sortedDetails} stores={filteredStoreObjects}
                    foodBand={thresholds.food} laborBand={thresholds.labor}
                    onBarClick={handleBarClick} />,
                },
                {
                  key: 'avgSpend', label: '客單價（元）',
                  children: <DetailBarChart details={sortedDetails} stores={filteredStoreObjects}
                    getValue={(d) => d.avgSpend}
                    formatLabel={(v) => `$${fmtNumber(v)}`} formatTooltip={(v) => `$${fmtNumber(v)}`}
                    yAxisFormatter={(v) => `$${v}`} getColor={() => COLORS.blue}
                    onBarClick={handleBarClick} />,
                },
                {
                  key: 'lunch', label: '午間鍋數 & 估比',
                  children: <DualAxisChart details={sortedDetails} stores={filteredStoreObjects}
                    getBar={(d) => anaVal(d, '午間鍋數')} barLabel="午間鍋數"
                    formatBar={fmtNumber} barColor={COLORS.green}
                    getLine={(d) => {
                      const s = d.analysis.find((a) => a.label === '午間鍋佔比')?.current;
                      return parseFloat(String(s ?? '0')) || 0;
                    }} lineLabel="午間鍋估比"
                    formatLine={(v) => `${v.toFixed(1)}%`} lineColor={COLORS.primaryDark}
                    rightAxisUnit="%" onBarClick={handleBarClick} />,
                },
              ]} />
            </Card>
          </Col>

          {/* ② 會員 */}
          <Col xs={24}>
            <Card size="small" title={<span style={titleStyle}>會員</span>} style={cardStyle} bodyStyle={{ paddingTop: 0 }}>
              <Tabs defaultActiveKey="memberTotal" tabBarStyle={{ marginBottom: 0 }} items={[
                {
                  key: 'memberTotal', label: '會員人數',
                  children: <DetailBarChart details={sortedDetails} stores={filteredStoreObjects}
                    getValue={(d) => d.member.total}
                    formatLabel={fmtNumber} formatTooltip={fmtNumber}
                    yAxisFormatter={fmtNumber} getColor={() => COLORS.primaryMid}
                    onBarClick={handleBarClick} />,
                },
                {
                  key: 'memberNew', label: '本月新增會員',
                  children: <DetailBarChart details={sortedDetails} stores={filteredStoreObjects}
                    getValue={(d) => d.member.newCount}
                    formatLabel={fmtNumber} formatTooltip={fmtNumber}
                    yAxisFormatter={fmtNumber} getColor={() => COLORS.green}
                    onBarClick={handleBarClick} />,
                },
                {
                  key: 'memberSpendDual', label: '會員消費金額 & 估比',
                  children: <DualAxisChart details={sortedDetails} stores={filteredStoreObjects}
                    getBar={(d) => d.member.spend} barLabel="會員消費金額"
                    formatBar={fmtNumber} barColor={COLORS.primaryMid}
                    getLine={(d) => d.memberSpendPct} lineLabel="會員消費估比"
                    formatLine={(v) => fmtPct(v)} lineColor={COLORS.green}
                    rightAxisUnit="%" onBarClick={handleBarClick} />,
                },
              ]} />
            </Card>
          </Col>

          {/* ③ 商場競爭占比 */}
          <Col xs={24}>
            <MallOverviewSection
              sortedDetails={sortedDetails}
              filteredStoreObjects={filteredStoreObjects}
              mallStoreId={mallStoreId}
              setMallStoreId={setMallStoreId}
              cardStyle={cardStyle}
              titleStyle={titleStyle}
            />
          </Col>

          {/* ④ 其他（作廢） */}
          <Col xs={24}>
            <Card size="small" title={<span style={titleStyle}>其他（作廢）</span>} style={cardStyle} bodyStyle={{ paddingTop: 0 }}>
              <Tabs defaultActiveKey="voidAmount" tabBarStyle={{ marginBottom: 0 }} items={[
                {
                  key: 'voidAmount', label: '（發票）作廢金額',
                  children: <DetailBarChart details={sortedDetails} stores={filteredStoreObjects}
                    getValue={(d) => d.other.voidAmount}
                    formatLabel={fmtNumber} formatTooltip={fmtNumber}
                    yAxisFormatter={fmtNumber} getColor={() => COLORS.orange}
                    onBarClick={handleBarClick} />,
                },
                {
                  key: 'voidCount', label: '（發票）作廢張數',
                  children: <DetailBarChart details={sortedDetails} stores={filteredStoreObjects}
                    getValue={(d) => d.other.voidCount}
                    formatLabel={(v) => `${v} 張`} formatTooltip={(v) => `${v} 張`}
                    yAxisFormatter={(v) => `${v}`} getColor={() => COLORS.orange}
                    onBarClick={handleBarClick} />,
                },
              ]} />
            </Card>
          </Col>
        </Row>

        {/* ── 全店數據明細表 ──────────────────────────────────── */}
        <Divider style={{ margin: '24px 0 12px' }}>
          <Text style={{ fontSize: 12, color: '#aaa' }}>全店數據明細表</Text>
        </Divider>
        <Card
          size="small"
          title={<span style={{ color: '#1F4E5F', fontWeight: 700 }}>全店數據明細（業績 · 食材 · 人事 · 來客 · 午間 · 會員 · 其他）</span>}
          style={cardStyle}
          extra={
            <Space size={12}>
              <span style={{ fontSize: 11, color: '#aaa' }}>紅字 = 超標 · 橘字 = 偏低 · 綠字 = 達標</span>
              {currentUser.role !== 'manager' && (
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => { void exportOverviewExcel(sortedDetails, filteredStoreObjects, period); }}
                >
                  匯出 Excel
                </Button>
              )}
            </Space>
          }
        >
          <OverviewMetricsTable details={sortedDetails} stores={filteredStoreObjects} />
        </Card>
      </div>
    </div>
  );
}
