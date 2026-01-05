export interface Doctor {
  id: string; // UUID
  kode_dokter: string;
  nama: string;
  gelar_depan?: string;
  gelar_belakang?: string;
  jenis_kelamin?: 'L' | 'P';
  tanggal_lahir?: string;
  no_hp?: string;
  email?: string;
  alamat?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
