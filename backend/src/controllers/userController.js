const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, name, email, role, position, created_at FROM users ORDER BY created_at DESC'
        );

        const users = rows.map(u => ({
            id: u.id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            position: u.position,
            createdAt: u.created_at
        }));

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, name, email, role, position, created_at FROM users WHERE id = $1',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const u = rows[0];
        res.json({
            success: true,
            data: {
                id: u.id.toString(),
                name: u.name,
                email: u.email,
                role: u.role,
                position: u.position,
                createdAt: u.created_at
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Create new user (admin only)
 */
exports.createUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password, name, role, position } = req.body;

    try {
        // Check if email already exists
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const result = await db.query(
            'INSERT INTO users (email, password, name, role, position) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, position, created_at',
            [email, hashedPassword, name || email.split('@')[0], role || 'user', position || null]
        );

        const u = result.rows[0];
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: u.id.toString(),
                name: u.name,
                email: u.email,
                role: u.role,
                position: u.position,
                createdAt: u.created_at
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update user (admin only)
 */
exports.updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { name, email, role, position, password } = req.body;

    try {
        // Check if user exists
        const existing = await db.query('SELECT id FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if email is taken by another user
        if (email) {
            const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (email !== undefined) {
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }
        if (role !== undefined) {
            updates.push(`role = $${paramCount++}`);
            values.push(role);
        }
        if (position !== undefined) {
            updates.push(`position = $${paramCount++}`);
            values.push(position);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updates.push(`password = $${paramCount++}`);
            values.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        const result = await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, position, created_at`,
            values
        );

        const u = result.rows[0];
        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: u.id.toString(),
                name: u.name,
                email: u.email,
                role: u.role,
                position: u.position,
                createdAt: u.created_at
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete user (admin only) - soft delete by setting role to 'inactive'
 */
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Prevent deleting yourself
        if (req.user.id.toString() === id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get available roles
 */
exports.getRoles = (req, res) => {
    const roles = [
        { value: 'admin', label: 'Administrator' },
        { value: 'doctor', label: 'Doctor' },
        { value: 'nurse', label: 'Nurse' },
        { value: 'staff', label: 'Staff' },
        { value: 'readonly', label: 'Read Only' },
        { value: 'user', label: 'User' }
    ];
    res.json({ success: true, data: roles });
};
