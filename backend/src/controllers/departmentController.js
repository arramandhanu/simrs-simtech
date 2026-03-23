const db = require('../config/database');

/**
 * Department Controller
 * Handles CRUD operations for hospital departments/clinics.
 */

/**
 * Get all departments
 * Optional query: ?active=true to filter active only
 */
exports.getAll = async (req, res) => {
    const { active } = req.query;

    try {
        let query = 'SELECT * FROM departments';
        const params = [];

        if (active === 'true') {
            query += ' WHERE is_active = true';
        }

        query += ' ORDER BY name ASC';

        const { rows } = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get single department by ID
 */
exports.getById = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query('SELECT * FROM departments WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Create a new department
 */
exports.create = async (req, res) => {
    const { name, code, description } = req.body;

    if (!name || !code) {
        return res.status(400).json({
            success: false,
            message: 'Fields "name" and "code" are required.'
        });
    }

    try {
        const query = `
      INSERT INTO departments (name, code, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const { rows } = await db.query(query, [name, code.toUpperCase(), description || null]);

        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Department code already exists.' });
        }
        console.error('Error creating department:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update a department
 */
exports.update = async (req, res) => {
    const { id } = req.params;
    const { name, code, description, is_active } = req.body;

    try {
        const query = `
      UPDATE departments
      SET name = COALESCE($1, name),
          code = COALESCE($2, code),
          description = COALESCE($3, description),
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
        const values = [name, code ? code.toUpperCase() : null, description, is_active, id];
        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Department code already exists.' });
        }
        console.error('Error updating department:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete a department
 */
exports.remove = async (req, res) => {
    const { id } = req.params;

    try {
        const { rowCount } = await db.query('DELETE FROM departments WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }

        res.json({ success: true, message: 'Department deleted.' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
