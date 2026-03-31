import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { getFullName, getInitials } from "@/utils/user.utils";

export const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(user);
  const fullName = getFullName(user);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full hover:bg-slate-50 transition-colors border hover:border-slate-200"
      >
        <div className="topnav-avatar">{initials}</div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] w-56 bg-slate-50 border border-slate-200 rounded-xl shadow-lg z-[100] anim fade-in scale-95 origin-top-right !duration-150 py-1"
          style={{
            background: "var(--color-surface)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* User Info */}
          <div className="px-4 py-2 border-b border-slate-200 mb-1">
            <p className="text-sm font-bold text-slate-900 truncate">
              {fullName}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>

          <div className="border-b border-slate-200">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors group"
            >
              <User
                size={16}
                className="text-slate-400 group-hover:text-slate-700"
              />
              <span>My Profile</span>
            </Link>

            <Link
              to="/security"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors group mb-1"
            >
              <Settings
                size={16}
                className="text-slate-400 group-hover:text-slate-700"
              />
              <span>Account</span>
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors font-medium"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
