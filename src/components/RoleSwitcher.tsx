import { Select, Tag } from 'antd';
import { useRole } from '../context/RoleContext';
import { COLORS } from '../lib/colors';

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

export default function RoleSwitcher() {
  const { currentUser, setCurrentUser, allUsers } = useRole();
  if (!currentUser) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Tag
        style={{
          backgroundColor: roleColor[currentUser.role],
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        {roleLabel[currentUser.role]}
      </Tag>
      <Select
        size="small"
        value={currentUser.id}
        style={{ width: 110 }}
        onChange={(id) => {
          const user = allUsers.find((u) => u.id === id);
          if (user) setCurrentUser(user);
        }}
        options={allUsers.map((u) => ({
          value: u.id,
          label: `${u.name}（${roleLabel[u.role]}）`,
        }))}
      />
    </div>
  );
}
