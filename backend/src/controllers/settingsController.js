const db = require('../config/database');

/**
 * Get user settings
 */
exports.getUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        // Try to get existing settings
        let { rows } = await db.query(
            'SELECT * FROM user_settings WHERE user_id = $1',
            [userId]
        );

        // If no settings exist, create default
        if (rows.length === 0) {
            const insertResult = await db.query(
                `INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *`,
                [userId]
            );
            rows = insertResult.rows;
        }

        const settings = rows[0];
        res.json({
            success: true,
            data: {
                theme: settings.theme,
                language: settings.language,
                notificationsEnabled: settings.notifications_enabled,
                emailNotifications: settings.email_notifications,
                sidebarCollapsed: settings.sidebar_collapsed,
                compactMode: settings.compact_mode,
                customSettings: settings.settings_json
            }
        });
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update user settings
 */
exports.updateUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            theme,
            language,
            notificationsEnabled,
            emailNotifications,
            sidebarCollapsed,
            compactMode
        } = req.body;

        // Upsert settings
        const { rows } = await db.query(
            `INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, sidebar_collapsed, compact_mode, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                theme = COALESCE($2, user_settings.theme),
                language = COALESCE($3, user_settings.language),
                notifications_enabled = COALESCE($4, user_settings.notifications_enabled),
                email_notifications = COALESCE($5, user_settings.email_notifications),
                sidebar_collapsed = COALESCE($6, user_settings.sidebar_collapsed),
                compact_mode = COALESCE($7, user_settings.compact_mode),
                updated_at = NOW()
             RETURNING *`,
            [userId, theme, language, notificationsEnabled, emailNotifications, sidebarCollapsed, compactMode]
        );

        const settings = rows[0];
        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                theme: settings.theme,
                language: settings.language,
                notificationsEnabled: settings.notifications_enabled,
                emailNotifications: settings.email_notifications,
                sidebarCollapsed: settings.sidebar_collapsed,
                compactMode: settings.compact_mode
            }
        });
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get all hospital settings (admin only)
 */
exports.getHospitalSettings = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT setting_key, setting_value, setting_type, description FROM hospital_settings ORDER BY setting_key'
        );

        // Convert to object format
        const settings = {};
        rows.forEach(row => {
            let value = row.setting_value;
            // Parse based on type
            if (row.setting_type === 'boolean') {
                value = value === 'true';
            } else if (row.setting_type === 'number') {
                value = parseInt(value, 10);
            }
            settings[row.setting_key] = value;
        });

        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Error fetching hospital settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update hospital settings (admin only)
 */
exports.updateHospitalSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        // Update each setting
        for (const [key, value] of Object.entries(updates)) {
            await db.query(
                `UPDATE hospital_settings 
                 SET setting_value = $1, updated_by = $2, updated_at = NOW()
                 WHERE setting_key = $3`,
                [String(value), userId, key]
            );
        }

        // Fetch updated settings
        const { rows } = await db.query(
            'SELECT setting_key, setting_value, setting_type FROM hospital_settings'
        );

        const settings = {};
        rows.forEach(row => {
            let value = row.setting_value;
            if (row.setting_type === 'boolean') {
                value = value === 'true';
            } else if (row.setting_type === 'number') {
                value = parseInt(value, 10);
            }
            settings[row.setting_key] = value;
        });

        res.json({
            success: true,
            message: 'Hospital settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Error updating hospital settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { rows } = await db.query(
            'SELECT id, name, email, role, position, keycloak_id, status, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = rows[0];
        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                position: user.position,
                isSSO: !!user.keycloak_id,
                status: user.status,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, position } = req.body;

        const { rows } = await db.query(
            `UPDATE users SET name = COALESCE($1, name), position = COALESCE($2, position) 
             WHERE id = $3 RETURNING id, name, email, role, position`,
            [name, position, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: rows[0]
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
