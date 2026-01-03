

export interface DashboardStat {
  id: string;
  title: string;
  value: string | number;
  change: string; // e.g., "+12%"
  trend: 'up' | 'down';
  iconName: string; // We'll map string names to icons in the component
  color: string; // Tailwind class
}

export interface DashboardData {
  stats: DashboardStat[];
}
