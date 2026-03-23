const db = require('../config/database');

/**
 * TTS Controller
 * Manages voice templates and generates TTS text for queue calls.
 * Actual audio synthesis is done on the frontend using the Web Speech API
 * or a third-party TTS service — this controller provides the text templates.
 */

// ---------- Voice Templates ----------

/**
 * Get all voice templates
 */
exports.getTemplates = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM voice_templates ORDER BY is_default DESC, language ASC'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching voice templates:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Create a voice template
 */
exports.createTemplate = async (req, res) => {
    const { language, template_text, description, is_default } = req.body;

    if (!template_text) {
        return res.status(400).json({
            success: false,
            message: 'Field "template_text" is required.'
        });
    }

    try {
        // If setting as default, unset other defaults for same language
        if (is_default) {
            await db.query(
                'UPDATE voice_templates SET is_default = false WHERE language = $1',
                [language || 'id']
            );
        }

        const query = `
      INSERT INTO voice_templates (language, template_text, description, is_default)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const values = [language || 'id', template_text, description || null, is_default || false];
        const { rows } = await db.query(query, values);

        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error creating voice template:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update a voice template
 */
exports.updateTemplate = async (req, res) => {
    const { id } = req.params;
    const { language, template_text, description, is_default } = req.body;

    try {
        // If setting as default, unset other defaults for same language
        if (is_default) {
            const lang = language || 'id';
            await db.query(
                'UPDATE voice_templates SET is_default = false WHERE language = $1 AND id != $2',
                [lang, id]
            );
        }

        const query = `
      UPDATE voice_templates
      SET language = COALESCE($1, language),
          template_text = COALESCE($2, template_text),
          description = COALESCE($3, description),
          is_default = COALESCE($4, is_default),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
        const values = [language, template_text, description, is_default, id];
        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error updating voice template:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete a voice template
 */
exports.deleteTemplate = async (req, res) => {
    const { id } = req.params;

    try {
        const { rowCount } = await db.query('DELETE FROM voice_templates WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        res.json({ success: true, message: 'Template deleted.' });
    } catch (error) {
        console.error('Error deleting voice template:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Generate the TTS text for a specific queue call.
 * Replaces placeholders like {{queue_number}} and {{counter_name}} in the template.
 */
exports.generateCallText = async (req, res) => {
    const { queue_item_id, language } = req.body;

    if (!queue_item_id) {
        return res.status(400).json({
            success: false,
            message: 'Field "queue_item_id" is required.'
        });
    }

    try {
        // Get queue item with counter info
        const itemResult = await db.query(
            `SELECT qi.*, c.name AS counter_name, d.name AS department_name
       FROM queue_items qi
       LEFT JOIN counters c ON qi.counter_id = c.id
       LEFT JOIN departments d ON qi.department_id = d.id
       WHERE qi.id = $1`,
            [queue_item_id]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Queue item not found' });
        }

        const item = itemResult.rows[0];

        // Get the default template for the requested language
        const lang = language || 'id';
        const templateResult = await db.query(
            'SELECT * FROM voice_templates WHERE language = $1 AND is_default = true LIMIT 1',
            [lang]
        );

        if (templateResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: `No default template for language "${lang}".` });
        }

        const template = templateResult.rows[0].template_text;

        // Replace placeholders
        const text = template
            .replace(/\{\{queue_number\}\}/g, item.queue_number || '')
            .replace(/\{\{counter_name\}\}/g, item.counter_name || '')
            .replace(/\{\{department_name\}\}/g, item.department_name || '')
            .replace(/\{\{patient_name\}\}/g, item.patient_name || 'Pasien');

        res.json({
            success: true,
            data: {
                text,
                language: lang,
                queue_number: item.queue_number,
                counter_name: item.counter_name
            }
        });
    } catch (error) {
        console.error('Error generating call text:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ---------- Clinic Schedule ----------

/**
 * Get schedules for a department
 */
exports.getSchedules = async (req, res) => {
    const { department_id } = req.query;

    try {
        let query = `
      SELECT cs.*, d.name AS department_name
      FROM clinic_schedules cs
      LEFT JOIN departments d ON cs.department_id = d.id
    `;
        const params = [];

        if (department_id) {
            query += ' WHERE cs.department_id = $1';
            params.push(department_id);
        }

        query += ' ORDER BY cs.department_id, cs.day_of_week';

        const { rows } = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Upsert a schedule entry (create or update)
 */
exports.upsertSchedule = async (req, res) => {
    const { department_id, day_of_week, open_time, close_time, is_active } = req.body;

    if (department_id === undefined || day_of_week === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Fields "department_id" and "day_of_week" are required.'
        });
    }

    try {
        const query = `
      INSERT INTO clinic_schedules (department_id, day_of_week, open_time, close_time, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (department_id, day_of_week)
      DO UPDATE SET
        open_time = COALESCE($3, clinic_schedules.open_time),
        close_time = COALESCE($4, clinic_schedules.close_time),
        is_active = COALESCE($5, clinic_schedules.is_active)
      RETURNING *
    `;
        const values = [department_id, day_of_week, open_time || null, close_time || null, is_active !== undefined ? is_active : true];
        const { rows } = await db.query(query, values);

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error upserting schedule:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
