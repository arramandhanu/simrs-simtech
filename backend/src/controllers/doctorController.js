const db = require('../config/database');

exports.getAllDoctors = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM dokter ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM dokter WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createDoctor = async (req, res) => {
  const {
    kode, nama, gelar, jenis_kelamin, tempat_lahir, tanggal_lahir,
    nik, email, no_telp, alamat, practitioner_id,
    no_str, tgl_berlaku_str, tgl_kadaluarsa_str,
    no_sip, tgl_berlaku_sip, tgl_kadaluarsa_sip,
    spesialisasi, pendidikan, status_pegawai, poli, jabatan, shift,
    nip, tgl_mulai_kerja, jabatan_struktural, status_aktif,
    unit_kerja, golongan, gaji_pokok, tunjangan
  } = req.body;

  // Basic validation
  if (!kode || !nama || !jenis_kelamin || !practitioner_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Required fields: kode, nama, jenis_kelamin, practitioner_id' 
    });
  }

  try {
    const query = `
      INSERT INTO dokter (
        kode, nama, gelar, jenis_kelamin, tempat_lahir, tanggal_lahir,
        nik, email, no_telp, alamat, practitioner_id,
        no_str, tgl_berlaku_str, tgl_kadaluarsa_str,
        no_sip, tgl_berlaku_sip, tgl_kadaluarsa_sip,
        spesialisasi, pendidikan, status_pegawai, poli, jabatan, shift,
        nip, tgl_mulai_kerja, jabatan_struktural, status_aktif,
        unit_kerja, golongan, gaji_pokok, tunjangan
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      ) RETURNING *
    `;

    const values = [
      kode, nama, gelar || null, jenis_kelamin, tempat_lahir || null, tanggal_lahir || null,
      nik || null, email || null, no_telp || null, alamat || null, practitioner_id,
      no_str || null, tgl_berlaku_str || null, tgl_kadaluarsa_str || null,
      no_sip || null, tgl_berlaku_sip || null, tgl_kadaluarsa_sip || null,
      spesialisasi || null, pendidikan || null, status_pegawai || null, poli || null, jabatan || null, shift || null,
      nip || null, tgl_mulai_kerja || null, jabatan_struktural || null, status_aktif || 'Aktif',
      unit_kerja || null, golongan || null, gaji_pokok || null, tunjangan || null
    ];

    const { rows } = await db.query(query, values);
    res.status(201).json({ success: true, data: rows[0], message: 'Doctor created successfully' });
  } catch (error) {
    console.error('Error creating doctor:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ success: false, message: 'Doctor with this code already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateDoctor = async (req, res) => {
  const { id } = req.params;
  const {
    kode, nama, gelar, jenis_kelamin, tempat_lahir, tanggal_lahir,
    nik, email, no_telp, alamat, practitioner_id,
    no_str, tgl_berlaku_str, tgl_kadaluarsa_str,
    no_sip, tgl_berlaku_sip, tgl_kadaluarsa_sip,
    spesialisasi, pendidikan, status_pegawai, poli, jabatan, shift,
    nip, tgl_mulai_kerja, jabatan_struktural, status_aktif,
    unit_kerja, golongan, gaji_pokok, tunjangan
  } = req.body;

  // Basic validation
  if (!kode || !nama || !jenis_kelamin || !practitioner_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Required fields: kode, nama, jenis_kelamin, practitioner_id' 
    });
  }

  try {
    const query = `
      UPDATE dokter SET
        kode = $1, nama = $2, gelar = $3, jenis_kelamin = $4, tempat_lahir = $5, tanggal_lahir = $6,
        nik = $7, email = $8, no_telp = $9, alamat = $10, practitioner_id = $11,
        no_str = $12, tgl_berlaku_str = $13, tgl_kadaluarsa_str = $14,
        no_sip = $15, tgl_berlaku_sip = $16, tgl_kadaluarsa_sip = $17,
        spesialisasi = $18, pendidikan = $19, status_pegawai = $20, poli = $21, jabatan = $22, shift = $23,
        nip = $24, tgl_mulai_kerja = $25, jabatan_struktural = $26, status_aktif = $27,
        unit_kerja = $28, golongan = $29, gaji_pokok = $30, tunjangan = $31,
        updated_at = NOW()
      WHERE id = $32
      RETURNING *
    `;

    const values = [
      kode, nama, gelar || null, jenis_kelamin, tempat_lahir || null, tanggal_lahir || null,
      nik || null, email || null, no_telp || null, alamat || null, practitioner_id,
      no_str || null, tgl_berlaku_str || null, tgl_kadaluarsa_str || null,
      no_sip || null, tgl_berlaku_sip || null, tgl_kadaluarsa_sip || null,
      spesialisasi || null, pendidikan || null, status_pegawai || null, poli || null, jabatan || null, shift || null,
      nip || null, tgl_mulai_kerja || null, jabatan_struktural || null, status_aktif || 'Aktif',
      unit_kerja || null, golongan || null, gaji_pokok || null, tunjangan || null,
      id
    ];

    const { rows } = await db.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: rows[0], message: 'Doctor updated successfully' });
  } catch (error) {
    console.error('Error updating doctor:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Doctor with this code already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
