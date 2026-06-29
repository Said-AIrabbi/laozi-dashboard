import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { RoleProvider, useRole } from './context/RoleContext';
import { SettingsProvider } from './context/SettingsContext';
import Login from './pages/Login';
import Overview from './pages/Overview';
import StoreDetail from './pages/StoreDetail';
import AdminUsers from './pages/AdminUsers';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useRole();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { currentUser, isLoggedIn } = useRole();
  const navigate = useNavigate();

  // Manager: redirect to their store after login
  useEffect(() => {
    if (isLoggedIn && currentUser?.role === 'manager') {
      const ids = currentUser.storeIds ?? [];
      if (ids.length === 1) navigate(`/store/${ids[0]}`, { replace: true });
    }
  }, [isLoggedIn, currentUser, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Overview />
          </RequireAuth>
        }
      />
      <Route
        path="/store/:storeId"
        element={
          <RequireAuth>
            <StoreDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <AdminUsers />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhTW}
      theme={{
        token: {
          colorPrimary: '#1F4E5F',
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif',
        },
      }}
    >
      <SettingsProvider>
        <RoleProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </RoleProvider>
      </SettingsProvider>
    </ConfigProvider>
  );
}
