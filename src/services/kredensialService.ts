import type { KredensialSTR } from '../types/kredensial';
import type { ApiResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const kredensialService = {
  // Get STR for a doctor
  async getSTR(dokterId: string): Promise<ApiResponse<KredensialSTR | null>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/kredensial/str/${dokterId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  },

  // Upload/Update STR
  async uploadSTR(
    dokterId: string,
    data: { nomor_str: string; berlaku_sampai: string; file: File }
  ): Promise<ApiResponse<KredensialSTR>> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('nomor_str', data.nomor_str);
    formData.append('berlaku_sampai', data.berlaku_sampai);
    formData.append('file', data.file);

    const response = await fetch(`${API_BASE}/kredensial/str/${dokterId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return await response.json();
  },

  // Get file URL
  getFileUrl(filePath: string): string {
    const baseUrl = API_BASE.replace('/api', '');
    return `${baseUrl}${filePath}`;
  },
};
