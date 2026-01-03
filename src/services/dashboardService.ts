import { apiClient } from './apiClient';
import type { DashboardStat } from '../types/dashboard';
import type { ApiResponse } from '../types/api';

export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStat[]>> {
    return await apiClient.get<DashboardStat[]>('/dashboard/stats');
  }
};

