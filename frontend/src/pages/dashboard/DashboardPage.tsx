import { lazy, Suspense, useEffect } from 'react';
import { useUIStore, type DashboardView } from '@/stores/uiStore';
import { useAllowedViews } from '@/hooks/useAllowedViews';

const EmployeeDashboard = lazy(() => import('./EmployeeDashboard'));
const ManagerDashboard = lazy(() => import('./ManagerDashboard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));

const DashboardLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-accent)',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  </div>
);

const DashboardPage: React.FC = () => {
  const { activeDashboardView, setDashboardView } = useUIStore();

  const allowedViews = useAllowedViews();

  // If the persisted view is no longer allowed (e.g. permissions changed), fall back to employee
  useEffect(() => {
    if (!allowedViews.includes(activeDashboardView)) {
      setDashboardView('employee');
    }
  }, [activeDashboardView, allowedViews, setDashboardView]);

  const view: DashboardView = allowedViews.includes(activeDashboardView) ? activeDashboardView : 'employee';

  return (
    <Suspense fallback={<DashboardLoader />}>
      {view === 'admin' ? (
        <AdminDashboard />
      ) : view === 'manager' ? (
        <ManagerDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </Suspense>
  );
};

export default DashboardPage;
