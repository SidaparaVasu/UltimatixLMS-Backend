import { useUIStore } from '@/stores/uiStore';
import { Menu } from 'lucide-react';

export const Header = () => {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full border-b bg-white px-4">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-md">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
