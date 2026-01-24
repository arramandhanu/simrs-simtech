import React, { useEffect, useState } from "react";
import { Menu, Search, Bell } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useRole } from "../auth/RoleGuard";
import { userService } from "../../services/userService";

interface TopBarProps {
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
}

// Helper to format role for display
const formatRole = (role?: string): string => {
  if (!role) return "User";
  const roleMap: Record<string, string> = {
    admin: "Administrator",
    doctor: "Doctor",
    nurse: "Nurse",
    staff: "Staff",
    user: "User",
  };
  return roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
};

export const TopBar: React.FC<TopBarProps> = ({
  toggleSidebar,
  toggleMobileMenu,
}) => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending count for admin users
  useEffect(() => {
    if (isAdmin) {
      const fetchPendingCount = async () => {
        try {
          const res = await userService.getPendingCount();
          if (res && res.success && res.data) {
            setPendingCount(res.data.count);
          } else {
            const unwrapped = res as unknown as { count?: number };
            if (unwrapped && typeof unwrapped.count === "number") {
              setPendingCount(unwrapped.count);
            }
          }
        } catch (err) {
          console.error("Failed to fetch pending count", err);
        }
      };
      fetchPendingCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* ... existing buttons and search ... */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-4 py-2.5 w-64 focus-within:w-80 focus-within:bg-white focus-within:ring-2 focus-within:ring-medical-100 transition-all duration-300">
          <Search size={20} className="text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search patients, doctors..."
            className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <button className="relative p-2 text-slate-400 hover:text-medical-600 hover:bg-medical-50 rounded-lg transition-all">
          <Bell size={24} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
          {pendingCount === 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-slate-300 rounded-full border-2 border-white"></span>
          )}
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-700">
              {user?.name || "Guest User"}
            </p>
            <p className="text-xs text-slate-500">
              {formatRole(user?.role)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-medical-100 border-2 border-white shadow-sm overflow-hidden">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${user?.name || "Guest"
                }&background=0ea5e9&color=fff`
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
