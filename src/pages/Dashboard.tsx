import { useEffect, useState } from "react";
import {
  Users,
  Activity,
  DollarSign,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { StatsCard } from "../features/dashboard/components/StatsCard";
import { PatientTable } from "../features/dashboard/components/PatientTable";
import { dashboardService } from "../services/dashboardService";
import { patientService } from "../services/patientService";
import type { DashboardStat } from "../types/dashboard";
import type { Patient } from "../types/patient";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Calendar,
  Activity,
  DollarSign,
};

import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, patientsRes] = await Promise.all([
          dashboardService.getStats(),
          patientService.getRecentPatients(),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (patientsRes.success) setPatients(patientsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">Loading dashboard...</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard Overview
        </h1>
        <p className="text-slate-500">
          Welcome back, {user?.name || "Doctor"}. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatsCard
            key={stat.id}
            title={stat.title}
            value={String(stat.value)}
            change={stat.change}
            trend={stat.trend}
            icon={iconMap[stat.iconName] || Activity}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1">
        {/* Recent Patients */}
        <div className="w-full">
          <PatientTable patients={patients} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
