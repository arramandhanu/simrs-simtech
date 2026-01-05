export interface Spesialis {
  id: string;
  kode: string;
  nama: string;
  created_at?: string;
}

export interface DokterSpesialis {
  dokter_id: string;
  spesialis_id: string;
  is_utama: boolean;
  spesialis?: Spesialis; // Joined data
}
