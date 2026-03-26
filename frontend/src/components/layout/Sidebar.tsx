import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/utils/cn"; // Adjusted to the util path
import { Home, BookOpen, User as UserIcon, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export const Sidebar = () => {
  const { isSidebarOpen } = useUIStore();

  const navItems = [
    { label: "Dashboard", icon: Home, path: "/dashboard" },
    { label: "Courses", icon: BookOpen, path: "/courses" },
    { label: "Users", icon: UserIcon, path: "/users" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside
      className={cn(
        "relative h-full border-r bg-white transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-20",
      )}
    >
      <div className="flex items-center gap-4 p-4 border border-b border-slate-200 h-16">
        
        <h1 className="text-xl font-bold text-slate-900">LOGO</h1>
      </div>
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="flex items-center gap-4 p-3 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-blue-600 transition-colors"
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
