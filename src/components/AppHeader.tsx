import { Button, Space, Typography, Tooltip } from 'antd';
import { TeamOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import RoleSwitcher from './RoleSwitcher';
import { COLORS } from '../lib/colors';

const { Title } = Typography;

export default function AppHeader() {
  const { currentUser, logout } = useRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      style={{
        background: '#1F4E5F',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 18 }}>
        🍲 荖子鍋 · 營運 BI Dashboard
      </Title>

      <Space size={12}>
        {/* Role switcher (demo only) */}
        <RoleSwitcher />

        {/* User management — admin only */}
        {currentUser?.role === 'admin' && (
          <Tooltip title="使用者管理">
            <Button
              icon={<TeamOutlined />}
              size="small"
              onClick={() => navigate('/admin/users')}
              style={{
                background: COLORS.primaryMid,
                borderColor: 'transparent',
                color: '#fff',
              }}
            >
              使用者管理
            </Button>
          </Tooltip>
        )}

        {/* Logout */}
        <Tooltip title="登出">
          <Button
            icon={<LogoutOutlined />}
            size="small"
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.12)',
              borderColor: 'transparent',
              color: '#fff',
            }}
          >
            登出
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
}
