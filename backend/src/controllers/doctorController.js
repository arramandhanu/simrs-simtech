const db = require('../config/database');

exports.getAllDoctors = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM dokter ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM dokter WHERE id = ?', [req.params.id]);
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
  // TODO: Add full field list based on schema
  const { kode, nama, sip } = req.body; 
  // For now, simple implementation to verify connectivity
  try {
     // This is a placeholder insert. Real implementation needs all fields.
     // Since the user provided a large schema, usually we'd dynamically build the query or map all fields.
     // For this step, I'll focus on getting the READ part working perfectly first as requested "management" usually implies listing first.
     // But to "manage", create is important.
     // Let's implement a robust insert later/next step when we have the form.
     res.status(501).json({ success: false, message: 'Create not implemented yet' });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
