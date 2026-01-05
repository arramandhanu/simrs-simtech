import { apiClient } from './apiClient';
import type { Doctor } from '../types/doctor';
import type { ApiResponse } from '../types/api';

export const doctorService = {
  async getAllDoctors(): Promise<ApiResponse<Doctor[]>> {
    return await apiClient.get<Doctor[]>('/doctors');
  },

  async getDoctor(id: string): Promise<ApiResponse<Doctor>> {
    return await apiClient.get<Doctor>(`/doctors/${id}`);
  },

  async createDoctor(data: Partial<Doctor>): Promise<ApiResponse<Doctor>> {
    return await apiClient.post<Doctor>('/doctors', data);
  },

  async updateDoctor(id: number, data: Partial<Doctor>): Promise<ApiResponse<Doctor>> {
    return await apiClient.put<Doctor>(`/doctors/${id}`, data);
  }
};
