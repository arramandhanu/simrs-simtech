const db = require('../config/database');

exports.getRecentPatients = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM patients ORDER BY created_at DESC LIMIT 10');
    
    // Map DB columns to Frontend expected format
    const patients = rows.map(p => ({
      id: p.id.toString(),
      mrn: p.no_rme,
      name: p.nama_lengkap,
      department: 'General', // Placeholder as schema doesn't have department/poli
      status: 'Waiting', // Placeholder as schema status is marital status, not admission status
    }));

    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const p = rows[0];
    const patient = {
      id: p.id.toString(),
      mrn: p.no_rme,
      name: p.nama_lengkap,
      department: 'General',
      status: 'Waiting',
      // Additional details
      gender: p.jenis_kelamin,
      dateOfBirth: p.tanggal_lahir,
      phone: p.no_telp,
      address: p.alamat
    };

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

