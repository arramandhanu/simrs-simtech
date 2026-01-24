const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/str');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get STR for a doctor
exports.getSTR = async (req, res) => {
  const { dokterId } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT * FROM dokter_str WHERE dokter_id = $1 ORDER BY created_at DESC LIMIT 1',
      [dokterId]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
    console.error('Error fetching STR:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upload/Update STR
exports.uploadSTR = async (req, res) => {
  const { dokterId } = req.params;
  const { nomor_str, berlaku_sampai } = req.body;
  const file = req.file;

  // Validation
  if (!nomor_str) {
    return res.status(400).json({ success: false, message: 'Nomor STR is required' });
  }
  if (!berlaku_sampai) {
    return res.status(400).json({ success: false, message: 'Berlaku sampai is required' });
  }
  if (!file) {
    return res.status(400).json({ success: false, message: 'File STR is required' });
  }

  // Validate date is in the future
  const expiryDate = new Date(berlaku_sampai);
  if (expiryDate <= new Date()) {
    return res.status(400).json({ success: false, message: 'Berlaku sampai must be a future date' });
  }

  try {
    // Check if STR already exists for this doctor
    const existing = await db.query(
      'SELECT * FROM dokter_str WHERE dokter_id = $1',
      [dokterId]
    );

    const fileName = file.filename;
    const filePath = `/uploads/str/${fileName}`;

    if (existing.rows.length > 0) {
      // Update existing
      const { rows } = await db.query(
        `UPDATE dokter_str SET 
          nomor_str = $1, berlaku_sampai = $2, file_name = $3, file_path = $4, updated_at = NOW()
         WHERE dokter_id = $5 RETURNING *`,
        [nomor_str, berlaku_sampai, fileName, filePath, dokterId]
      );
      res.json({ success: true, data: rows[0], message: 'STR updated successfully' });
    } else {
      // Insert new
      const { rows } = await db.query(
        `INSERT INTO dokter_str (dokter_id, nomor_str, berlaku_sampai, file_name, file_path)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [dokterId, nomor_str, berlaku_sampai, fileName, filePath]
      );
      res.status(201).json({ success: true, data: rows[0], message: 'STR uploaded successfully' });
    }
  } catch (error) {
    console.error('Error uploading STR:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Serve STR file
exports.getSTRFile = async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'File not found' });
  }
};
