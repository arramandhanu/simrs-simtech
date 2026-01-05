const db = require('../config/database');

// Get all specializations
exports.getAllSpesialis = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM spesialis ORDER BY nama ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching spesialis:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get doctor's specializations
exports.getDokterSpesialis = async (req, res) => {
  const { dokterId } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT ds.*, s.kode, s.nama 
      FROM dokter_spesialis ds
      JOIN spesialis s ON ds.spesialis_id = s.id
      WHERE ds.dokter_id = $1
    `, [dokterId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching dokter spesialis:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update doctor's specializations (both utama and tambahan)
exports.updateDokterSpesialis = async (req, res) => {
  const { dokterId } = req.params;
  const { spesialis_utama_id, spesialis_tambahan_id } = req.body;

  try {
    // Start transaction
    await db.query('BEGIN');

    // Delete existing specializations for this doctor
    await db.query('DELETE FROM dokter_spesialis WHERE dokter_id = $1', [dokterId]);

    // Insert new spesialis utama if provided
    if (spesialis_utama_id) {
      await db.query(
        'INSERT INTO dokter_spesialis (dokter_id, spesialis_id, is_utama) VALUES ($1, $2, $3)',
        [dokterId, spesialis_utama_id, true]
      );
    }

    // Insert new spesialis tambahan if provided
    if (spesialis_tambahan_id && spesialis_tambahan_id !== spesialis_utama_id) {
      await db.query(
        'INSERT INTO dokter_spesialis (dokter_id, spesialis_id, is_utama) VALUES ($1, $2, $3)',
        [dokterId, spesialis_tambahan_id, false]
      );
    }

    await db.query('COMMIT');

    // Fetch updated data
    const { rows } = await db.query(`
      SELECT ds.*, s.kode, s.nama 
      FROM dokter_spesialis ds
      JOIN spesialis s ON ds.spesialis_id = s.id
      WHERE ds.dokter_id = $1
    `, [dokterId]);

    res.json({ success: true, data: rows, message: 'Spesialisasi updated successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error updating dokter spesialis:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
