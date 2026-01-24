export interface KredensialSTR {
  id: string;
  dokter_id: string;
  nomor_str: string;
  berlaku_sampai: string;
  file_name?: string;
  file_path?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KredensialSIP {
  id: string;
  dokter_id: string;
  nomor_sip: string;
  poli: string;
  berlaku_sampai: string;
  file_name?: string;
  file_path?: string;
  created_at?: string;
  updated_at?: string;
}

export type KredensialStatus = 'valid' | 'hampir_habis' | 'expired';

export const getKredensialStatus = (berlakuSampai: string): KredensialStatus => {
  const expiryDate = new Date(berlakuSampai);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (expiryDate < today) {
    return 'expired';
  } else if (expiryDate <= thirtyDaysFromNow) {
    return 'hampir_habis';
  }
  return 'valid';
};
