import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Typography,
  Tag,
  Space,
  Popconfirm,
  Divider,
  message,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useRole } from '../context/RoleContext';
import { useSettings } from '../context/SettingsContext';
import { dashboardService } from '../services/dashboardService';
import type { User, Role, Store, Region } from '../types';
import { COLORS } from '../lib/colors';

const { Title } = Typography;

const roleLabel: Record<Role, string> = {
  admin: '系統管理員',
  director: '總監',
  supervisor: '分區督導',
  manager: '店長',
};

const roleColor: Record<Role, string> = {
  admin: '#7B3FBE',
  director: COLORS.primaryDark,
  supervisor: COLORS.primaryMid,
  manager: COLORS.green,
};

type FormValues = {
  name: string;
  username: string;
  password?: string;
  role: Role;
  regionIds?: string[];
  managerRegions?: string[]; // UI-only filter, not saved to User
  storeIds?: string[];
};

type StoreFormValues = {
  name: string;
  regionId: string;
  managerName: string;
  mallName?: string;
  supervisorId?: string;
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const { currentUser, allUsers, updateUser } = useRole();
  const { thresholds, setThresholds } = useSettings();
  const [localUsers, setLocalUsers] = useState<User[]>(allUsers);

  // Local editable copies of thresholds
  const [foodMin,  setFoodMin]  = useState(thresholds.food.min);
  const [foodMax,  setFoodMax]  = useState(thresholds.food.max);
  const [laborMin, setLaborMin] = useState(thresholds.labor.min);
  const [laborMax, setLaborMax] = useState(thresholds.labor.max);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  // ── 門市 / 分區管理 ──────────────────────────────────────
  const [localStores, setLocalStores] = useState<Store[]>(dashboardService.getAllStores());
  const [localRegions, setLocalRegions] = useState<Region[]>(dashboardService.getRegions());
  const [storeEditTarget, setStoreEditTarget] = useState<Store | null>(null);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const [storeForm] = Form.useForm<StoreFormValues>();

  const regions = localRegions;
  const stores = localStores;

  if (currentUser?.role !== 'admin') {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>
        僅管理者可存取此頁面
      </div>
    );
  }

  const openEdit = (user: User) => {
    setEditTarget(user);
    setIsAdding(false);
    // Derive which regions the manager's current stores belong to (for the filter UI)
    const managerRegions =
      user.role === 'manager' && user.storeIds
        ? [...new Set(stores.filter((s) => user.storeIds!.includes(s.id)).map((s) => s.regionId))]
        : [];
    form.setFieldsValue({
      name: user.name,
      username: user.username,
      password: undefined,
      role: user.role,
      regionIds: user.regionIds ?? [],
      managerRegions,
      storeIds: user.storeIds ?? [],
    });
  };

  const openAdd = () => {
    setEditTarget(null);
    setIsAdding(true);
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (isAdding) {
        const newUser: User = {
          id: `u-${Date.now()}`,
          name: values.name,
          username: values.username,
          password: values.password!,
          role: values.role,
          regionIds: values.role === 'supervisor' ? (values.regionIds ?? []) : undefined,
          storeIds:  values.role === 'manager'    ? (values.storeIds  ?? []) : undefined,
        };
        setLocalUsers((prev) => [...prev, newUser]);
        messageApi.success(`已新增使用者「${newUser.name}」（帳號：${newUser.username}）`);
      } else if (editTarget) {
        const updated: User = {
          ...editTarget,
          name: values.name,
          username: values.username,
          password: values.password ? values.password : editTarget.password,
          role: values.role,
          regionIds: values.role === 'supervisor' ? (values.regionIds ?? []) : undefined,
          storeIds:  values.role === 'manager'    ? (values.storeIds  ?? []) : undefined,
        };
        setLocalUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        updateUser(updated);
        messageApi.success(`已更新「${updated.name}」的設定`);
      }
      setEditTarget(null);
      setIsAdding(false);
    });
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser.id) {
      messageApi.warning('無法刪除目前登入中的帳號');
      return;
    }
    setLocalUsers((prev) => prev.filter((u) => u.id !== user.id));
    messageApi.success(`已刪除「${user.name}」`);
  };

  const supervisorOf = (regionId: string) =>
    localUsers.find((u) => u.role === 'supervisor' && (u.regionIds ?? []).includes(regionId));

  const openAddStore = () => {
    setStoreEditTarget(null);
    setIsAddingStore(true);
    storeForm.resetFields();
  };

  const openEditStore = (store: Store) => {
    setStoreEditTarget(store);
    setIsAddingStore(false);
    storeForm.setFieldsValue({
      name: store.name,
      regionId: store.regionId,
      managerName: store.managerName,
      mallName: store.mallName,
      supervisorId: supervisorOf(store.regionId)?.id,
    });
  };

  const applySupervisor = (regionId: string, supervisorId?: string) => {
    if (!supervisorId) return;
    const supervisor = localUsers.find((u) => u.id === supervisorId);
    if (supervisor && !(supervisor.regionIds ?? []).includes(regionId)) {
      const updated = { ...supervisor, regionIds: [...(supervisor.regionIds ?? []), regionId] };
      setLocalUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      updateUser(updated);
    }
  };

  const handleStoreModalOk = () => {
    storeForm.validateFields().then((values) => {
      if (isAddingStore) {
        const newStore: Store = {
          id: `s-${Date.now()}`,
          name: values.name.trim(),
          regionId: values.regionId,
          managerName: values.managerName.trim(),
          mallName: values.mallName?.trim() || undefined,
        };
        setLocalStores((prev) => [...prev, newStore]);
        applySupervisor(newStore.regionId, values.supervisorId);
        messageApi.success(`已新增門市「${newStore.name}」`);
      } else if (storeEditTarget) {
        const updated: Store = {
          ...storeEditTarget,
          name: values.name.trim(),
          regionId: values.regionId,
          managerName: values.managerName.trim(),
          mallName: values.mallName?.trim() || undefined,
        };
        setLocalStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        applySupervisor(updated.regionId, values.supervisorId);
        messageApi.success(`已更新「${updated.name}」的設定`);
      }
      setStoreEditTarget(null);
      setIsAddingStore(false);
    });
  };

  const handleDeleteStore = (store: Store) => {
    setLocalStores((prev) => prev.filter((s) => s.id !== store.id));
    messageApi.success(`已刪除「${store.name}」`);
  };

  const addRegion = () => {
    const name = newRegionName.trim();
    if (!name) return;
    if (localRegions.some((r) => r.name === name)) {
      messageApi.warning('此分區名稱已存在');
      return;
    }
    const region: Region = { id: `r-${Date.now()}`, name };
    setLocalRegions((prev) => [...prev, region]);
    storeForm.setFieldValue('regionId', region.id);
    setNewRegionName('');
  };

  const storeColumns = [
    {
      title: '門市名稱',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 600 }}>{name}</span>,
    },
    {
      title: '分區',
      key: 'region',
      render: (_: unknown, record: Store) =>
        localRegions.find((r) => r.id === record.regionId)?.name ?? '—',
    },
    {
      title: '店長',
      dataIndex: 'managerName',
      key: 'managerName',
    },
    {
      title: '負責督導',
      key: 'supervisor',
      render: (_: unknown, record: Store) => supervisorOf(record.regionId)?.name ?? '—',
    },
    {
      title: '商場',
      dataIndex: 'mallName',
      key: 'mallName',
      render: (mallName?: string) => mallName ?? '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Store) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditStore(record)} />
          <Popconfirm
            title={`確定要刪除「${record.name}」嗎？`}
            onConfirm={() => handleDeleteStore(record)}
            okText="刪除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const watchedRole           = Form.useWatch('role', form);
  const watchedManagerRegions = Form.useWatch('managerRegions', form) ?? [];

  // Stores filtered to the selected regions (for manager's step-2 dropdown)
  const filteredStores = watchedManagerRegions.length
    ? stores.filter((s) => watchedManagerRegions.includes(s.regionId))
    : [];

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: User) => (
        <Space>
          <span style={{ fontWeight: 600 }}>{name}</span>
          {record.id === currentUser.id && (
            <Tag style={{ fontSize: 10, padding: '0 4px' }}>目前登入</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '帳號',
      dataIndex: 'username',
      key: 'username',
      render: (username: string) => (
        <Tooltip title="登入用帳號">
          <Typography.Text code style={{ fontSize: 12 }}>{username}</Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: Role) => (
        <Tag style={{ background: roleColor[role], color: '#fff', border: 'none' }}>
          {roleLabel[role]}
        </Tag>
      ),
    },
    {
      title: '負責區域',
      key: 'region',
      render: (_: unknown, record: User) => {
        if (record.role === 'supervisor') {
          return (record.regionIds ?? [])
            .map((id) => regions.find((r) => r.id === id)?.name ?? id)
            .join('、') || '—';
        }
        return '—';
      },
    },
    {
      title: '負責門市',
      key: 'store',
      render: (_: unknown, record: User) => {
        if (record.role === 'manager' && (record.storeIds ?? []).length > 0) {
          return (record.storeIds ?? [])
            .map((id) => stores.find((s) => s.id === id)?.name ?? id)
            .join('、');
        }
        return '—';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title={`確定要刪除「${record.name}」嗎？`}
            onConfirm={() => handleDelete(record)}
            okText="刪除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {contextHolder}

      {/* Header */}
      <div
        className="page-pad-x"
        style={{
          background: '#1F4E5F',
          paddingTop: 12,
          paddingBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 8,
        }}
      >
        <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 18 }}>
          🍲 荖子鍋 · 營運 BI Dashboard
        </Title>
        <Tag style={{ background: COLORS.primaryMid, color: '#fff', border: 'none', fontWeight: 600 }}>
          {currentUser.name} · 系統管理員
        </Tag>
      </div>

      <div className="page-pad-x" style={{ paddingTop: 20, paddingBottom: 20 }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ borderColor: '#ccc' }}
          >
            返回總覽
          </Button>
          <Title level={3} style={{ margin: 0, color: '#1F4E5F' }}>
            系統管理
          </Title>
        </div>

        <Card
          style={{ borderRadius: 10, border: '1px solid #e8edf2' }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAdd}
              style={{ background: COLORS.primaryDark }}
            >
              新增使用者
            </Button>
          }
          title={
            <span style={{ color: '#1F4E5F', fontWeight: 700 }}>
              所有帳號（{localUsers.length} 位）
            </span>
          }
        >
          <Table
            size="small"
            dataSource={localUsers.map((u) => ({ ...u, key: u.id }))}
            columns={columns}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </Card>

        {/* ── 門市管理 ─────────────────────────────────────────── */}
        <Card
          style={{ borderRadius: 10, border: '1px solid #e8edf2', marginTop: 20 }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddStore}
              style={{ background: COLORS.primaryDark }}
            >
              新增門市
            </Button>
          }
          title={
            <span style={{ color: '#1F4E5F', fontWeight: 700 }}>
              <ShopOutlined style={{ marginRight: 6 }} />
              所有門市（{localStores.length} 間）
            </span>
          }
        >
          <Table
            size="small"
            dataSource={localStores.map((s) => ({ ...s, key: s.id }))}
            columns={storeColumns}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </Card>

        {/* ── 占比門檻設定 ─────────────────────────────────────── */}
        <Card
          style={{ borderRadius: 10, border: '1px solid #e8edf2', marginTop: 20 }}
          title={<span style={{ color: '#1F4E5F', fontWeight: 700 }}>占比門檻設定</span>}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* 食材 */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#555' }}>食材占比門檻</div>
              <Space wrap>
                <span style={{ fontSize: 13 }}>最低</span>
                <InputNumber
                  min={0} max={100} step={0.5}
                  value={foodMin}
                  onChange={(v) => setFoodMin(v ?? foodMin)}
                  formatter={(v) => `${v}%`}
                  parser={(v) => parseFloat((v ?? '').replace('%', '')) as unknown as 0}
                  style={{ width: 80 }}
                />
                <span style={{ fontSize: 13 }}>最高</span>
                <InputNumber
                  min={0} max={100} step={0.5}
                  value={foodMax}
                  onChange={(v) => setFoodMax(v ?? foodMax)}
                  formatter={(v) => `${v}%`}
                  parser={(v) => parseFloat((v ?? '').replace('%', '')) as unknown as 0}
                  style={{ width: 80 }}
                />
                <span style={{ fontSize: 12, color: '#aaa' }}>
                  目前設定：{thresholds.food.min}% – {thresholds.food.max}%
                </span>
              </Space>
            </div>

            <Divider style={{ margin: '4px 0' }} />

            {/* 人事 */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#555' }}>人事占比門檻</div>
              <Space wrap>
                <span style={{ fontSize: 13 }}>最低</span>
                <InputNumber
                  min={0} max={100} step={0.5}
                  value={laborMin}
                  onChange={(v) => setLaborMin(v ?? laborMin)}
                  formatter={(v) => `${v}%`}
                  parser={(v) => parseFloat((v ?? '').replace('%', '')) as unknown as 0}
                  style={{ width: 80 }}
                />
                <span style={{ fontSize: 13 }}>最高</span>
                <InputNumber
                  min={0} max={100} step={0.5}
                  value={laborMax}
                  onChange={(v) => setLaborMax(v ?? laborMax)}
                  formatter={(v) => `${v}%`}
                  parser={(v) => parseFloat((v ?? '').replace('%', '')) as unknown as 0}
                  style={{ width: 80 }}
                />
                <span style={{ fontSize: 12, color: '#aaa' }}>
                  目前設定：{thresholds.labor.min}% – {thresholds.labor.max}%
                </span>
              </Space>
            </div>

            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                style={{ background: COLORS.primaryDark }}
                onClick={() => {
                  if (foodMin >= foodMax || laborMin >= laborMax) {
                    messageApi.error('最低值必須小於最高值');
                    return;
                  }
                  setThresholds({ food: { min: foodMin, max: foodMax }, labor: { min: laborMin, max: laborMax } });
                  messageApi.success('門檻設定已儲存，圖表與報表即時生效');
                }}
              >
                儲存門檻設定
              </Button>
            </div>
          </Space>
        </Card>
      </div>

      {/* Edit / Add Modal */}
      <Modal
        open={editTarget !== null || isAdding}
        title={isAdding ? '新增使用者' : `編輯「${editTarget?.name}」的權限`}
        onOk={handleModalOk}
        onCancel={() => { setEditTarget(null); setIsAdding(false); }}
        okText={isAdding ? '新增' : '儲存'}
        cancelText="取消"
        okButtonProps={{ style: { background: COLORS.primaryDark } }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input placeholder="例：王小明" />
          </Form.Item>

          <Form.Item
            name="username"
            label="帳號"
            rules={[
              { required: true, message: '請輸入帳號' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const isDup = localUsers.some(
                    (u) => u.username === value.trim() && u.id !== editTarget?.id,
                  );
                  return isDup ? Promise.reject('此帳號已被使用') : Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="例：wang_xiaoming" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="password"
            label={isAdding ? '密碼' : '密碼（留空則維持不變）'}
            rules={isAdding ? [{ required: true, message: '請設定密碼' }] : []}
          >
            <Input.Password
              placeholder={isAdding ? '請設定密碼' : '留空則維持不變'}
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item name="role" label="角色" rules={[{ required: true, message: '請選擇角色' }]}>
            <Select
              options={[
                { value: 'admin', label: '系統管理員（最大權限，可進後台）' },
                { value: 'director', label: '總監（全區檢視，不可進後台）' },
                { value: 'supervisor', label: '分區督導' },
                { value: 'manager', label: '店長' },
              ]}
            />
          </Form.Item>

          {watchedRole === 'supervisor' && (
            <Form.Item name="regionIds" label="負責區域（可複選）">
              <Checkbox.Group
                options={regions.map((r) => ({ label: r.name, value: r.id }))}
              />
            </Form.Item>
          )}

          {watchedRole === 'manager' && (
            <>
              <Form.Item
                name="managerRegions"
                label="第一步：勾選負責分區"
                rules={[{ required: true, message: '請至少勾選一個分區' }]}
              >
                <Checkbox.Group
                  options={regions.map((r) => ({ label: r.name, value: r.id }))}
                  onChange={() => form.setFieldValue('storeIds', [])}
                />
              </Form.Item>

              <Form.Item
                name="storeIds"
                label="第二步：選擇負責門市（可複選）"
                rules={[{ required: true, message: '請至少選擇一間門市' }]}
              >
                <Select
                  mode="multiple"
                  placeholder={watchedManagerRegions.length ? '選擇門市' : '請先勾選分區'}
                  disabled={watchedManagerRegions.length === 0}
                  options={filteredStores.map((s) => ({ value: s.id, label: s.name }))}
                  allowClear
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Add / Edit Store Modal */}
      <Modal
        open={storeEditTarget !== null || isAddingStore}
        title={isAddingStore ? '新增門市' : `編輯「${storeEditTarget?.name}」的設定`}
        onOk={handleStoreModalOk}
        onCancel={() => { setStoreEditTarget(null); setIsAddingStore(false); }}
        okText={isAddingStore ? '新增' : '儲存'}
        cancelText="取消"
        okButtonProps={{ style: { background: COLORS.primaryDark } }}
        destroyOnClose
      >
        <Form form={storeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="門市名稱"
            rules={[
              { required: true, message: '請輸入門市名稱' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const isDup = localStores.some(
                    (s) => s.name === value.trim() && s.id !== storeEditTarget?.id,
                  );
                  return isDup ? Promise.reject('此門市名稱已存在') : Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="例：桃園店" />
          </Form.Item>

          <Form.Item name="regionId" label="分區" rules={[{ required: true, message: '請選擇分區' }]}>
            <Select
              placeholder="選擇分區"
              options={localRegions.map((r) => ({ value: r.id, label: r.name }))}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Space wrap style={{ padding: '0 8px 4px' }}>
                    <Input
                      placeholder="新增分區名稱"
                      size="small"
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onPressEnter={addRegion}
                    />
                    <Button size="small" type="link" onClick={addRegion}>
                      新增分區
                    </Button>
                  </Space>
                </>
              )}
            />
          </Form.Item>

          <Form.Item name="managerName" label="店長" rules={[{ required: true, message: '請輸入店長姓名' }]}>
            <Input placeholder="例：林志明" />
          </Form.Item>

          <Form.Item
            name="supervisorId"
            label={
              <Tooltip title="選擇的督導將自動納入此門市所屬分區的管轄範圍">
                負責督導（可選）
              </Tooltip>
            }
          >
            <Select
              placeholder="選擇區督導"
              allowClear
              options={localUsers.filter((u) => u.role === 'supervisor').map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>

          <Form.Item name="mallName" label="所在商場（可選）">
            <Input placeholder="例：台茂購物中心" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
