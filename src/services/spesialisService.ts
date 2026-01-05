import { apiClient } from './apiClient';
import type { Spesialis, DokterSpesialis } from '../types/spesialis';
import type { ApiResponse } from '../types/api';

export const spesialisService = {
  // Get all specializations (for dropdown options)
  async getAllSpesialis(): Promise<ApiResponse<Spesialis[]>> {
    return await apiClient.get<Spesialis[]>('/spesialis');
  },

  // Get doctor's specializations
  async getDokterSpesialis(dokterId: string): Promise<ApiResponse<DokterSpesialis[]>> {
    return await apiClient.get<DokterSpesialis[]>(`/spesialis/dokter/${dokterId}`);
  },

  // Update doctor's specializations
  async updateDokterSpesialis(
    dokterId: string, 
    data: { spesialis_utama_id?: string; spesialis_tambahan_id?: string }
  ): Promise<ApiResponse<DokterSpesialis[]>> {
    return await apiClient.put<DokterSpesialis[]>(`/spesialis/dokter/${dokterId}`, data);
  }
};
