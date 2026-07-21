import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { UploadFile } from 'antd';
import {
  Alert, Button, Card, Col, DatePicker, Modal,
  Row, Select, Space, Table, Tag, Typography, Upload, message,
} from 'antd';
import {
  ArrowLeftOutlined, DeleteOutlined, InboxOutlined, LoadingOutlined, ReloadOutlined,
} from '@ant-design/icons';
import AppHeader from '../components/AppHeader';
import { useRole } from '../context/RoleContext';
import { useImport } from '../context/ImportContext';
import { getVisibleStores } from '../lib/permissions';
import { mockStores } from '../mock/stores';
import { COLORS } from '../lib/colors';
import type { ImportRecord, ImportStatus, ReportType } from '../types';

/** Demo-only validation: infers common upload errors from the file name, since
 *  there's no real parsing backend yet. Mirrors the scenarios encoded in the seed data. */
function validateFile(
  fileName: string,
  storeId: string,
  periodStr: string,
): { status: ImportStatus; failReason?: string } {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
    return { status: 'failed', failReason: '格式錯誤：不支援的檔案類型，請上傳 .xlsx / .xls / .csv' };
  }

  const selectedStoreName = mockStores.find(s => s.id === storeId)?.name;
  const otherStore = mockStores.find(
    s => s.id !== storeId && fileName.includes(s.name) && !fileName.includes(selectedStoreName ?? '\0'),
  );
  if (otherStore) {
    return {
      status: 'store_mismatch',
      failReason: `門市不符：檔案內容顯示為「${otherStore.name}」，與所選門市「${selectedStoreName}」不符`,
    };
  }

  const periodMatch = fileName.match(/20\d{2}-\d{2}/);
  if (periodMatch && periodMatch[0] !== periodStr) {
    return {
      status: 'period_mismatch',
      failReason: `期間不符：檔案內容為 ${periodMatch[0]}，與所選期間 ${periodStr} 不符`,
    };
  }

  if (/壞|corrupt|損毀|error/i.test(fileName)) {
    return { status: 'failed', failReason: '檔案無法開啟：請確認檔案未毀損，或重新匯出後再上傳' };
  }

  return { status: 'success' };
}

const { Text, Title } = Typography;

/* ── Constants ──────────────────────────────────────────────────── */

const REPORT_TYPES: { key: ReportType; label: string; required: boolean }[] = [
  { key: 'pos_daily',         label: 'POS 營業帳務日報表',        required: true  },
  { key: 'product_txn',       label: '商品銷售明細',              required: true  },
  { key: 'product_summary',   label: '商品銷售統計表',            required: false },
  { key: 'purchase',          label: '採購入庫清單',              required: true  },
  { key: 'crm_store',         label: 'CRM 分店版（儀表板）',      required: true  },
  { key: 'crm_group',         label: 'CRM 總店版（會員招募）',    required: false },
  { key: 'customer_analysis', label: '顧客消費分析',              required: false },
  { key: 'labor',             label: '工時表',                    required: true  },
  { key: 'other_items',       label: '其他項目表單',              required: true  },
  { key: 'target',            label: '營業目標表',                required: true  },
];

const STATUS_CONFIG: Record<ImportStatus, { color: string; label: string; icon?: React.ReactNode }> = {
  success:         { color: COLORS.green,      label: '匯入成功' },
  parsing:         { color: COLORS.blue,       label: '解析中', icon: <LoadingOutlined /> },
  store_mismatch:  { color: COLORS.orange,     label: '門市不符' },
  period_mismatch: { color: COLORS.orange,     label: '期間不符' },
  duplicate:       { color: '#999',            label: '重複' },
  failed:          { color: COLORS.red,        label: '失敗' },
};

const reportLabel = (key: ReportType) =>
  REPORT_TYPES.find(r => r.key === key)?.label ?? key;

/* ── Sub-components ─────────────────────────────────────────────── */

function StatusTag({ status }: { status: ImportStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Tag color={cfg.color} icon={cfg.icon ?? undefined}>
      {cfg.label}
    </Tag>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */

export default function ImportData() {
  const { currentUser } = useRole();
  const { records, addRecord, updateRecord, removeRecord } = useImport();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  if (currentUser?.role !== 'manager') return <Navigate to="/" replace />;

  const stores = currentUser ? getVisibleStores(currentUser, mockStores) : [];

  const [selectedStore, setSelectedStore] = useState<string | undefined>(
    stores.length === 1 ? stores[0].id : undefined,
  );
  const [selectedPeriod, setSelectedPeriod] = useState<Dayjs | null>(dayjs('2026-02-01'));
  const [selectedType, setSelectedType] = useState<ReportType | undefined>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const periodStr = selectedPeriod?.format('YYYY-MM') ?? '';

  /* ── Completeness data ──────────────────────────────────────── */
  const successInPeriod = records.filter(
    r => r.storeId === selectedStore && r.period === periodStr && r.status === 'success',
  );
  const uploadedTypes = new Set(successInPeriod.map(r => r.reportType));
  const requiredMissing = REPORT_TYPES.filter(rt => rt.required && !uploadedTypes.has(rt.key));

  /* ── Handlers ────────────────────────────────────────────────── */
  const doImport = () => {
    setConfirmOpen(false);
    if (!selectedStore || !selectedPeriod || !selectedType || fileList.length === 0) return;

    // Remove any existing success record being overwritten
    records
      .filter(
        r =>
          r.storeId === selectedStore &&
          r.period === periodStr &&
          r.reportType === selectedType &&
          r.status === 'success',
      )
      .forEach(r => removeRecord(r.id));

    const ids = fileList.map(file =>
      addRecord({
        storeId: selectedStore,
        period: periodStr,
        reportType: selectedType,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        status: 'parsing',
      }),
    );

    const results = fileList.map(file => validateFile(file.name, selectedStore, periodStr));
    setFileList([]);

    setTimeout(() => {
      ids.forEach((id, i) => updateRecord(id, results[i]));
    }, 1500);
  };

  const handleImport = () => {
    if (!selectedStore)         { messageApi.warning('請選擇門市');       return; }
    if (!selectedPeriod)        { messageApi.warning('請選擇期間');       return; }
    if (!selectedType)          { messageApi.warning('請選擇報表類型');   return; }
    if (fileList.length === 0)  { messageApi.warning('請選擇至少一個檔案'); return; }

    const hasDuplicate = records.some(
      r =>
        r.storeId === selectedStore &&
        r.period === periodStr &&
        r.reportType === selectedType &&
        r.status === 'success',
    );

    if (hasDuplicate) {
      setConfirmOpen(true);
    } else {
      doImport();
    }
  };

  const handleReimport = (record: ImportRecord) => {
    updateRecord(record.id, { status: 'parsing', failReason: undefined, uploadedAt: new Date().toISOString() });
    const result = validateFile(record.fileName, record.storeId, record.period);
    setTimeout(() => updateRecord(record.id, result), 1500);
  };

  /* ── Table columns ───────────────────────────────────────────── */
  const columns = [
    {
      title: '門市',
      dataIndex: 'storeId',
      width: 80,
      render: (id: string) => mockStores.find(s => s.id === id)?.name ?? id,
    },
    {
      title: '期間',
      dataIndex: 'period',
      width: 80,
    },
    {
      title: '報表類型',
      dataIndex: 'reportType',
      render: (t: ReportType) => reportLabel(t),
    },
    {
      title: '檔名',
      dataIndex: 'fileName',
      ellipsis: true,
    },
    {
      title: '上傳時間',
      dataIndex: 'uploadedAt',
      width: 140,
      render: (t: string) => dayjs(t).format('YYYY/MM/DD HH:mm'),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 220,
      render: (s: ImportStatus, record: ImportRecord) => (
        <div>
          <StatusTag status={s} />
          {record.failReason && (
            <div style={{ fontSize: 12, color: COLORS.red, marginTop: 4 }}>
              {record.failReason}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      width: 190,
      render: (_: unknown, record: ImportRecord) => (
        <Space>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            disabled={record.status === 'parsing'}
            onClick={() => handleReimport(record)}
          >
            重新匯入
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={record.status === 'parsing'}
            onClick={() => removeRecord(record.id)}
          >
            刪除
          </Button>
        </Space>
      ),
    },
  ];

  /* ── Derived labels ─────────────────────────────────────────── */
  const selectedStoreName = mockStores.find(s => s.id === selectedStore)?.name;
  const completenessTitle =
    `本期報表到齊狀況` +
    (selectedStoreName ? ` — ${selectedStoreName}` : '') +
    (periodStr ? `  ${periodStr}` : '');

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {contextHolder}
      <AppHeader />

      <div className="page-pad-x" style={{ paddingTop: 24, paddingBottom: 24, maxWidth: 1280, margin: '0 auto' }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            type="link"
            style={{ padding: 0, marginBottom: 8, color: COLORS.primaryDark }}
            onClick={() => navigate(`/store/${(currentUser?.storeIds ?? [])[0]}`)}
          >
            返回門市業績頁
          </Button>
          <Title level={3} style={{ margin: 0 }}>報表上傳</Title>
          <Alert
            type="info"
            showIcon
            message="目前為示範介面，實際解析與數據更新將於正式版實作。"
            style={{ marginTop: 12 }}
          />
        </div>

        {/* ── A：上傳表單 ─────────────────────────────────────────── */}
        <Card title="上傳報表" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>門市</Text>
              <Select
                placeholder="請選擇門市"
                value={selectedStore}
                onChange={setSelectedStore}
                style={{ width: '100%' }}
                disabled={stores.length === 1}
                options={stores.map(s => ({ value: s.id, label: s.name }))}
              />
            </Col>

            <Col xs={24} sm={8}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>期間</Text>
              <DatePicker
                picker="month"
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                format="YYYY年MM月"
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} sm={8}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>報表類型</Text>
              <Select
                placeholder="請選擇報表類型"
                value={selectedType}
                onChange={setSelectedType}
                style={{ width: '100%' }}
                options={REPORT_TYPES.map(rt => ({
                  value: rt.key,
                  label: (
                    <span>
                      {rt.label}
                      {rt.required && (
                        <Tag color="red" style={{ marginLeft: 6, fontSize: 10, lineHeight: '18px' }}>
                          必要
                        </Tag>
                      )}
                    </span>
                  ),
                }))}
              />
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Upload.Dragger
              multiple
              accept=".xlsx,.xls,.csv"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => setFileList(fl)}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 40, color: COLORS.primaryMid }} />
              </p>
              <p className="ant-upload-text">點擊或拖放檔案至此</p>
              <p className="ant-upload-hint">支援 .xlsx / .xls / .csv，可一次選取多個檔案</p>
            </Upload.Dragger>
          </div>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" size="large" onClick={handleImport}>
              開始匯入
            </Button>
          </div>
        </Card>

        {/* ── C：本期報表到齊狀況 ──────────────────────────────────── */}
        <Card title={completenessTitle} style={{ marginBottom: 24 }}>
          {!selectedStore || !selectedPeriod ? (
            <Text type="secondary">請先在上方選擇門市與期間，即可查看本期報表到齊狀況。</Text>
          ) : (
            <>
              <Alert
                type={requiredMissing.length === 0 ? 'success' : 'warning'}
                showIcon
                message={
                  requiredMissing.length === 0
                    ? '必要報表已全數到齊，可進行月結。'
                    : `尚缺 ${requiredMissing.length} 份必要報表：${requiredMissing.map(r => r.label).join('、')}`
                }
                style={{ marginBottom: 16 }}
              />
              <Row gutter={[8, 12]}>
                {REPORT_TYPES.map(rt => {
                  const uploaded = uploadedTypes.has(rt.key);
                  const missingRequired = rt.required && !uploaded;
                  return (
                    <Col xs={24} sm={12} md={8} key={rt.key}>
                      <Space size={6} align="start">
                        <span style={{ fontSize: 16 }}>{uploaded ? '✅' : '⬜'}</span>
                        <span>
                          <Text style={{ color: missingRequired ? COLORS.red : undefined }}>
                            {rt.label}
                          </Text>
                          {rt.required && (
                            <Tag
                              color={missingRequired ? 'red' : 'default'}
                              style={{ marginLeft: 6, fontSize: 10, lineHeight: '18px' }}
                            >
                              必要
                            </Tag>
                          )}
                        </span>
                      </Space>
                    </Col>
                  );
                })}
              </Row>
            </>
          )}
        </Card>

        {/* ── B：匯入紀錄表 ────────────────────────────────────────── */}
        <Card title="匯入紀錄">
          <Table
            dataSource={records}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1010 }}
          />
        </Card>
      </div>

      {/* 覆蓋確認 Modal */}
      <Modal
        open={confirmOpen}
        title="確認覆蓋"
        okText="覆蓋匯入"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onOk={doImport}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>
          已有「{reportLabel(selectedType as ReportType)}」的匯入成功記錄。
          <br />
          是否覆蓋並重新匯入？原有記錄將被移除。
        </p>
      </Modal>
    </div>
  );
}
