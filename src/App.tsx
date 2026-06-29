import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { RoleProvider, useRole } from './context/RoleContext';
import { SettingsProvider } from './context/SettingsContext';
import { ImportProvider } from './context/ImportContext';
import Login from './pages/Login';
import Overview from './pages/Overview';
import StoreDetail from './pages/StoreDetail';
import AdminUsers from './pages/AdminUsers';
import ImportData from './pages/ImportData';

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
  const location = useLocation();

  // Manager with single store: redirect to their store only from the root path
  useEffect(() => {
    if (isLoggedIn && currentUser?.role === 'manager' && location.pathname === '/') {
      const ids = currentUser.storeIds ?? [];
      if (ids.length === 1) navigate(`/store/${ids[0]}`, { replace: true });
    }
  }, [isLoggedIn, currentUser, navigate, location.pathname]);

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
      <Route
        path="/import"
        element={
          <RequireAuth>
            <ImportData />
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
        <ImportProvider>
          <RoleProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </RoleProvider>
        </ImportProvider>
      </SettingsProvider>
    </ConfigProvider>
  );
}
