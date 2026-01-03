import { apiClient } from './apiClient';
import type { Patient } from '../types/patient';
import type { ApiResponse } from '../types/api';

export const patientService = {
  async getRecentPatients(): Promise<ApiResponse<Patient[]>> {
    return await apiClient.get<Patient[]>('/patients/recent');
  },
  
  async getPatient(id: string): Promise<ApiResponse<Patient | null>> {
    return await apiClient.get<Patient | null>(`/patients/${id}`);
  }
};

