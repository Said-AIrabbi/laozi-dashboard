import { Button, Space, Typography, Tooltip } from 'antd';
import { TeamOutlined, LogoutOutlined, UploadOutlined } from '@ant-design/icons';
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
      <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 18, whiteSpace: 'nowrap' }}>
        🍲 荖子鍋<span className="header-subtitle"> · 營運 BI Dashboard</span>
      </Title>

      <Space size={12} wrap>
        {/* Role switcher (demo only) */}
        <RoleSwitcher />

        {/* Report upload — manager only */}
        {currentUser?.role === 'manager' && (
          <Tooltip title="報表上傳">
            <Button
              icon={<UploadOutlined />}
              size="small"
              onClick={() => navigate('/import')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderColor: 'transparent',
                color: '#fff',
              }}
            >
              <span className="btn-label">報表上傳</span>
            </Button>
          </Tooltip>
        )}

        {/* System management — admin only */}
        {currentUser?.role === 'admin' && (
          <Tooltip title="系統管理">
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
              <span className="btn-label">系統管理</span>
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
            <span className="btn-label">登出</span>
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
}
