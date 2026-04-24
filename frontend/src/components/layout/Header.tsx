import { useUIStore } from '@/stores/uiStore';
import { Bell, Menu } from 'lucide-react';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { UserMenu } from '@/components/layout/UserMenu';
import { DashboardSwitcher } from '@/components/layout/DashboardSwitcher';

export const Header = () => {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="topnav">
      <button onClick={toggleSidebar} className="topnav-toggle" title="Toggle sidebar">
        <Menu size={18} />
      </button>

      <span className="topnav-title" />

      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <div className="topnav-actions">

          <button className="topnav-icon-btn" title="Notifications">
            <Bell size={18} />
            <span className="notif-dot" />
          </button>

          <ThemeSwitcher />

          {/* Always visible — renders null internally when user has only one view */}
          <DashboardSwitcher />

          <UserMenu />
        </div>
      </div>
    </header>
  );
};
