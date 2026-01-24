import React, { useEffect, useState, useRef } from "react";
import { Menu, Search, Bell, UserCheck, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useRole } from "../auth/RoleGuard";
import { userService } from "../../services/userService";

interface TopBarProps {
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch pending count and users for admin
  useEffect(() => {
    if (isAdmin) {
      const fetchPendingData = async () => {
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

          // Fetch pending users for dropdown
          const usersRes = await userService.getAllUsers("pending");
          if (usersRes && usersRes.success && usersRes.data) {
            setPendingUsers(usersRes.data.slice(0, 5) as PendingUser[]); // Show max 5
          } else if (Array.isArray(usersRes)) {
            setPendingUsers((usersRes as PendingUser[]).slice(0, 5));
          }
        } catch (err) {
          console.error("Failed to fetch pending data", err);
        }
      };
      fetchPendingData();
      const interval = setInterval(fetchPendingData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const handleQuickApprove = async (userId: string) => {
    setApproving(userId);
    try {
      await userService.approveUser(userId);
      setPendingUsers((prev: PendingUser[]) => prev.filter((u: PendingUser) => u.id !== userId));
      setPendingCount((prev: number) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to approve user", err);
    } finally {
      setApproving(null);
    }
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate("/users?tab=pending");
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
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
        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => isAdmin && setShowDropdown(!showDropdown)}
            className={`relative p-2 text-slate-400 hover:text-medical-600 hover:bg-medical-50 rounded-lg transition-all ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
          >
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

          {/* Dropdown Menu */}
          {showDropdown && isAdmin && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">Pending Approvals</h3>
                <button onClick={() => setShowDropdown(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No pending approvals
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {pendingUsers.map((u) => (
                    <div key={u.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{u.name || u.email}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                      <button
                        onClick={() => handleQuickApprove(u.id)}
                        disabled={approving === u.id}
                        className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 disabled:opacity-50 flex items-center gap-1"
                      >
                        {approving === u.id ? (
                          <span className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UserCheck size={14} />
                        )}
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleViewAll}
                className="w-full p-3 text-sm text-blue-600 hover:bg-blue-50 font-medium flex items-center justify-center gap-1"
              >
                View All Users
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

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
