import React from "react";
import { Menu, Search, Bell } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

interface TopBarProps {
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  toggleSidebar,
  toggleMobileMenu,
}) => {
  const { user } = useAuth();

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
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-700">
              {user?.name || "Guest User"}
            </p>
            <p className="text-xs text-slate-500">
              {user?.position || "Medical Staff"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-medical-100 border-2 border-white shadow-sm overflow-hidden">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${
                  user?.name || "Guest"
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
