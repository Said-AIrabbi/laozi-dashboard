import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Divider, Typography, message, Tag } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRole } from '../context/RoleContext';
import type { User } from '../types';
import { COLORS } from '../lib/colors';

const { Title, Text } = Typography;

const roleLabel: Record<string, string> = {
  admin: '系統管理',
  director: '總監',
  supervisor: '分區督導',
  manager: '店長',
};

const roleColor: Record<string, string> = {
  admin: '#7B3FBE',
  director: COLORS.primaryDark,
  supervisor: COLORS.primaryMid,
  manager: COLORS.green,
};


export default function Login() {
  const { login, allUsers } = useRole();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = ({ username, password }: { username: string; password: string }) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = allUsers.find((u) => u.username === username.trim());
      if (!user || user.password !== password) {
        messageApi.error('帳號或密碼錯誤');
        return;
      }
      login(user);
      redirectAfterLogin(user);
    }, 600);
  };

  const handleQuickLogin = (user: User) => {
    login(user);
    redirectAfterLogin(user);
  };

  const redirectAfterLogin = (user: User) => {
    if (user.role === 'manager' && (user.storeIds ?? []).length === 1) {
      navigate(`/store/${user.storeIds![0]}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1F4E5F 0%, #2E6E8E 60%, #1D9E75 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {contextHolder}

      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, lineHeight: 1 }}>🍲</div>
        <Title level={2} style={{ color: '#fff', margin: '12px 0 4px', letterSpacing: 2 }}>
          荖子鍋
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
          營運 BI Dashboard · 內部管理系統
        </Text>
      </div>

      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          border: 'none',
        }}
        styles={{ body: { padding: '32px 32px 24px' } }}
      >
        <Title level={4} style={{ textAlign: 'center', color: '#1F4E5F', marginBottom: 24 }}>
          登入
        </Title>

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '請輸入帳號' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#aaa' }} />}
              placeholder="帳號"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#aaa' }} />}
              placeholder="密碼"
              size="large"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ background: COLORS.primaryDark, height: 44, fontSize: 15 }}
            >
              登入
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '20px 0 16px' }}>
          <Text style={{ fontSize: 12, color: '#aaa' }}>Demo 帳號快速登入</Text>
        </Divider>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleQuickLogin(user)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #e8edf2',
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: '#fafcfe',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#eef5fa')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fafcfe')}
            >
              <Tag
                style={{
                  background: roleColor[user.role],
                  color: '#fff',
                  border: 'none',
                  fontSize: 11,
                  minWidth: 56,
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                {roleLabel[user.role]}
              </Tag>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1a2a35' }}>
                {user.name}
              </span>
              <span style={{ fontSize: 12, color: '#999', fontFamily: 'monospace' }}>
                {user.username}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#bbb' }}>
                {user.password}
              </span>
            </div>
          ))}
        </div>

        <Text
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 16,
            fontSize: 11,
            color: '#bbb',
          }}
        >
          點擊上方列表可快速登入，密碼顯示於各列右側
        </Text>
      </Card>
    </div>
  );
}
