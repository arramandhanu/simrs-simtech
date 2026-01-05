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
    kode_dokter, nama, gelar_depan, gelar_belakang,
    jenis_kelamin, tanggal_lahir, no_hp, email, alamat, status
  } = req.body;

  // Basic validation
  if (!kode_dokter || !nama) {
    return res.status(400).json({ 
      success: false, 
      message: 'Required fields: kode_dokter, nama' 
    });
  }

  try {
    const query = `
      INSERT INTO dokter (
        kode_dokter, nama, gelar_depan, gelar_belakang,
        jenis_kelamin, tanggal_lahir, no_hp, email, alamat, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      kode_dokter, nama, gelar_depan || null, gelar_belakang || null,
      jenis_kelamin || null, tanggal_lahir || null, no_hp || null,
      email || null, alamat || null, status || 'AKTIF'
    ];

    const { rows } = await db.query(query, values);
    res.status(201).json({ success: true, data: rows[0], message: 'Doctor created successfully' });
  } catch (error) {
    console.error('Error creating doctor:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Doctor with this code already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateDoctor = async (req, res) => {
  const { id } = req.params;
  const {
    kode_dokter, nama, gelar_depan, gelar_belakang,
    jenis_kelamin, tanggal_lahir, no_hp, email, alamat, status
  } = req.body;

  // Basic validation
  if (!kode_dokter || !nama) {
    return res.status(400).json({ 
      success: false, 
      message: 'Required fields: kode_dokter, nama' 
    });
  }

  try {
    const query = `
      UPDATE dokter SET
        kode_dokter = $1, nama = $2, gelar_depan = $3, gelar_belakang = $4,
        jenis_kelamin = $5, tanggal_lahir = $6, no_hp = $7, email = $8,
        alamat = $9, status = $10, updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      kode_dokter, nama, gelar_depan || null, gelar_belakang || null,
      jenis_kelamin || null, tanggal_lahir || null, no_hp || null,
      email || null, alamat || null, status || 'AKTIF', id
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

exports.deleteDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await db.query('DELETE FROM dokter WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
