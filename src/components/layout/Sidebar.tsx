import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  LogOut,
  X,
  LayoutDashboard,
  Stethoscope,
  Users,
  UserRound,
  Siren,
  Bed,
  ListOrdered,
  Pill,
  Settings,
  UsersRound,
} from "lucide-react";
import logo from "../../assets/logo/logo.png";
import { useRole } from "../auth/RoleGuard";

interface SidebarProps {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const SidebarItem = ({
  to,
  icon: Icon,
  label,
  collapsed,
}: {
  to: string;
  icon: any;
  label: string;
  collapsed: boolean;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
        ? "bg-medical-50 text-medical-600 font-medium"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      }`
    }
  >
    <Icon size={22} className="min-w-[22px]" />
    <span
      className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
    >
      {label}
    </span>
    {!collapsed && (
      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-medical-500 opacity-0 group-[.active]:opacity-100 transition-opacity" />
    )}
  </NavLink>
);

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();

  const handleLogout = () => {
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/dokter", icon: Stethoscope, label: "Dokter" },
    { to: "/paramedis", icon: UserRound, label: "Paramedis" },
    { to: "/pasien", icon: Users, label: "Pasien" },
    { to: "/igd", icon: Siren, label: "IGD" },
    { to: "/rawat-jalan", icon: Activity, label: "Rawat Jalan" },
    { to: "/rawat-inap", icon: Bed, label: "Rawat Inap" },
    { to: "/antrian", icon: ListOrdered, label: "Antrian" },
    { to: "/farmasi", icon: Pill, label: "Farmasi" },
    { to: "/settings", icon: Settings, label: "Settings" },
    // Admin only
    ...(isAdmin ? [{ to: "/users", icon: UsersRound, label: "Users" }] : []),
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 transition-all duration-300 z-20 ${sidebarOpen ? "w-64" : "w-20"
          }`}
      >
        <div className="h-20 flex items-center px-4 border-b border-slate-100">
          <div className="flex items-center gap-3 text-medical-600 overflow-hidden">
            <div className="w-9 h-9">
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span
              className={`font-bold text-xl tracking-tight text-slate-800 transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0"
                }`}
            >
              SIMRS
            </span>
          </div>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <SidebarItem key={item.label} {...item} collapsed={!sidebarOpen} />
          ))}
        </div>

        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors ${!sidebarOpen && "justify-center"
              }`}
          >
            <LogOut size={22} />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${!sidebarOpen ? "w-0 opacity-0" : "w-auto opacity-100"
                }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 bg-white w-64 z-50 transform transition-transform duration-300 md:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <span className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <Activity className="text-medical-600" /> SIMRS
          </span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4 space-y-1">
          {navItems.map((item) => (
            <SidebarItem key={item.label} {...item} collapsed={false} />
          ))}
        </div>
      </aside>
    </>
  );
};
