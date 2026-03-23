const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Import Keycloak Admin Service for role sync
let keycloakAdminService;
try {
    keycloakAdminService = require('../services/keycloakAdminService');
} catch (e) {
    console.log('Keycloak Admin Service not available, role sync disabled');
}

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res) => {
    try {
        const { status } = req.query;

        let query = 'SELECT id, name, email, role, position, status, keycloak_id, approved_at, created_at FROM users';
        const params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const { rows } = await db.query(query, params);

        const users = rows.map(u => ({
            id: u.id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            position: u.position,
            status: u.status,
            keycloakId: u.keycloak_id,
            approvedAt: u.approved_at,
            createdAt: u.created_at
        }));

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get pending users count
 */
exports.getPendingCount = async (req, res) => {
    try {
        const { rows } = await db.query("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
        res.json({ success: true, data: { count: parseInt(rows[0].count) } });
    } catch (error) {
        console.error('Error fetching pending count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, name, email, role, position, status, keycloak_id, approved_at, created_at FROM users WHERE id = $1',
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
                status: u.status,
                keycloakId: u.keycloak_id,
                approvedAt: u.approved_at,
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

        // Hash password if provided
        let hashedPassword = null;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        // Admin-created users are automatically approved
        const result = await db.query(
            `INSERT INTO users (email, password, name, role, position, status, approved_at, approved_by) 
             VALUES ($1, $2, $3, $4, $5, 'approved', NOW(), $6) 
             RETURNING id, name, email, role, position, status, created_at`,
            [email, hashedPassword, name || email.split('@')[0], role || 'user', position || null, req.user.id]
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
                status: u.status,
                createdAt: u.created_at
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Approve user (admin only)
 */
exports.approveUser = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body; // Optional role to assign on approval

    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = rows[0];

        if (user.status === 'approved') {
            return res.status(400).json({ success: false, message: 'User is already approved' });
        }

        const newRole = role || user.role || 'user';

        // Update user status to approved
        const result = await db.query(
            `UPDATE users SET status = 'approved', role = $1, approved_at = NOW(), approved_by = $2 
             WHERE id = $3 
             RETURNING id, name, email, role, position, status, keycloak_id, approved_at`,
            [newRole, req.user.id, id]
        );

        const approvedUser = result.rows[0];

        // Sync role to Keycloak if user has keycloak_id
        if (approvedUser.keycloak_id && keycloakAdminService) {
            try {
                await keycloakAdminService.syncUserRole(approvedUser.keycloak_id, newRole);
            } catch (syncError) {
                console.error('Keycloak role sync failed:', syncError.message);
                // Don't fail the approval, just log the error
            }
        }

        res.json({
            success: true,
            message: 'User approved successfully',
            data: {
                id: approvedUser.id.toString(),
                name: approvedUser.name,
                email: approvedUser.email,
                role: approvedUser.role,
                status: approvedUser.status,
                approvedAt: approvedUser.approved_at
            }
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Reject user (admin only)
 */
exports.rejectUser = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const result = await db.query(
            `UPDATE users SET status = 'rejected' WHERE id = $1 RETURNING id, email, status`,
            [id]
        );

        res.json({
            success: true,
            message: 'User rejected',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error rejecting user:', error);
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
        const existing = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const currentUser = existing.rows[0];
        const previousRole = currentUser.role;

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
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} 
             RETURNING id, name, email, role, position, status, keycloak_id, created_at`,
            values
        );

        const u = result.rows[0];

        // Sync role to Keycloak if role changed and user has keycloak_id
        if (role !== undefined && role !== previousRole && u.keycloak_id && keycloakAdminService) {
            try {
                await keycloakAdminService.syncUserRole(u.keycloak_id, role);
                console.log(`Synced role '${role}' to Keycloak for user ${u.email}`);
            } catch (syncError) {
                console.error('Keycloak role sync failed:', syncError.message);
                // Don't fail the update, just log the error
            }
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: u.id.toString(),
                name: u.name,
                email: u.email,
                role: u.role,
                position: u.position,
                status: u.status,
                createdAt: u.created_at
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete user (admin only)
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
 * Suspend user (admin only)
 */
exports.suspendUser = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent suspending yourself
        if (req.user.id.toString() === id) {
            return res.status(400).json({ success: false, message: 'Cannot suspend your own account' });
        }

        const result = await db.query(
            `UPDATE users SET status = 'suspended' WHERE id = $1 RETURNING id, email, name, status`,
            [id]
        );

        res.json({
            success: true,
            message: 'User suspended',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error suspending user:', error);
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

/**
 * Get user statuses
 */
exports.getStatuses = (req, res) => {
    const statuses = [
        { value: 'pending', label: 'Pending Approval' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'suspended', label: 'Suspended' }
    ];
    res.json({ success: true, data: statuses });
};
