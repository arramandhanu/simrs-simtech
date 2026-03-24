import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopBar } from "../../components/layout/TopBar";
import { useAppearance } from "../../context/AppearanceContext";

const DashboardLayout = () => {
  const { sidebarCollapsed, setSidebarCollapsed, isCompact } = useAppearance();
  const [sidebarOpen, setSidebarOpen] = useState(!sidebarCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync sidebarOpen with context preference on first mount
  useEffect(() => {
    setSidebarOpen(!sidebarCollapsed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    setSidebarCollapsed(!next);
  };
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans`}>
      <Sidebar
        sidebarOpen={sidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          toggleSidebar={toggleSidebar}
          toggleMobileMenu={toggleMobileMenu}
        />

        <main className={`flex-1 overflow-y-auto ${isCompact ? 'p-2 md:p-4' : 'p-4 md:p-8'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

