const db = require('../config/database');

/**
 * Counter Controller
 * Handles CRUD and operator assignment for service counters (loket).
 */

/**
 * Get all counters
 * Optional query: ?department_id=1
 */
exports.getAll = async (req, res) => {
    const { department_id } = req.query;

    try {
        let query = `
      SELECT c.*, d.name AS department_name, u.name AS operator_name
      FROM counters c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.operator_id = u.id
    `;
        const params = [];

        if (department_id) {
            query += ' WHERE c.department_id = $1';
            params.push(department_id);
        }

        query += ' ORDER BY d.name ASC, c.code ASC';

        const { rows } = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching counters:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get single counter by ID
 */
exports.getById = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
      SELECT c.*, d.name AS department_name, u.name AS operator_name
      FROM counters c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.operator_id = u.id
      WHERE c.id = $1
    `;
        const { rows } = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Counter not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching counter:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Create a new counter
 */
exports.create = async (req, res) => {
    const { department_id, name, code } = req.body;

    if (!department_id || !name || !code) {
        return res.status(400).json({
            success: false,
            message: 'Fields "department_id", "name", and "code" are required.'
        });
    }

    try {
        const query = `
      INSERT INTO counters (department_id, name, code)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const { rows } = await db.query(query, [department_id, name, code.toUpperCase()]);

        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Counter code already exists in this department.' });
        }
        console.error('Error creating counter:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update a counter
 */
exports.update = async (req, res) => {
    const { id } = req.params;
    const { name, code, department_id, status } = req.body;

    try {
        const query = `
      UPDATE counters
      SET name = COALESCE($1, name),
          code = COALESCE($2, code),
          department_id = COALESCE($3, department_id),
          status = COALESCE($4, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
        const values = [name, code ? code.toUpperCase() : null, department_id, status, id];
        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Counter not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error updating counter:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Assign an operator to a counter and set it active
 */
exports.assignOperator = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; // from JWT

    try {
        const query = `
      UPDATE counters
      SET operator_id = $1, status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
        const { rows } = await db.query(query, [userId, id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Counter not found' });
        }

        res.json({ success: true, data: rows[0], message: 'Counter assigned to you.' });
    } catch (error) {
        console.error('Error assigning operator:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Release operator from counter (set inactive)
 */
exports.releaseOperator = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
      UPDATE counters
      SET operator_id = NULL, status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
        const { rows } = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Counter not found' });
        }

        res.json({ success: true, data: rows[0], message: 'Counter released.' });
    } catch (error) {
        console.error('Error releasing operator:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete a counter
 */
exports.remove = async (req, res) => {
    const { id } = req.params;

    try {
        const { rowCount } = await db.query('DELETE FROM counters WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Counter not found' });
        }

        res.json({ success: true, message: 'Counter deleted.' });
    } catch (error) {
        console.error('Error deleting counter:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
