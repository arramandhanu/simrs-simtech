const db = require('../config/database');
const { broadcast } = require('../services/websocketService');

/**
 * Queue Controller
 * Core queue management: register patients, call, recall, skip, transfer.
 */

// ---------- Helper: Generate Next Queue Number ----------

/**
 * Generates the next queue number for a department today.
 * Format: department_code + sequential number, e.g. "A-001"
 */
async function generateQueueNumber(departmentId) {
    const deptResult = await db.query('SELECT code FROM departments WHERE id = $1', [departmentId]);
    if (deptResult.rows.length === 0) {
        throw new Error('Department not found');
    }

    const prefix = deptResult.rows[0].code;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const countResult = await db.query(
        `SELECT COUNT(*) AS total FROM queue_items
     WHERE department_id = $1 AND created_at::date = $2::date`,
        [departmentId, today]
    );

    const nextNumber = parseInt(countResult.rows[0].total, 10) + 1;
    const padded = String(nextNumber).padStart(3, '0');

    return `${prefix}-${padded}`;
}

// ---------- Queue Operations ----------

/**
 * Register a patient to the queue
 */
exports.registerPatient = async (req, res) => {
    const { patient_name, department_id, priority } = req.body;

    if (!department_id) {
        return res.status(400).json({
            success: false,
            message: 'Field "department_id" is required.'
        });
    }

    const validPriorities = ['normal', 'elderly', 'emergency'];
    const selectedPriority = validPriorities.includes(priority) ? priority : 'normal';

    try {
        const queueNumber = await generateQueueNumber(department_id);

        const query = `
      INSERT INTO queue_items (queue_number, patient_name, department_id, priority)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const values = [queueNumber, patient_name || null, department_id, selectedPriority];
        const { rows } = await db.query(query, values);

        res.status(201).json({ success: true, data: rows[0] });
        broadcast('queue:registered', rows[0]);
    } catch (error) {
        console.error('Error registering patient to queue:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get active queue (today's waiting + called items)
 * Optional query: ?department_id=1&status=waiting
 */
exports.getActiveQueue = async (req, res) => {
    const { department_id, status } = req.query;
    const today = new Date().toISOString().split('T')[0];

    try {
        let query = `
      SELECT qi.*, d.name AS department_name, d.code AS department_code,
             c.name AS counter_name
      FROM queue_items qi
      LEFT JOIN departments d ON qi.department_id = d.id
      LEFT JOIN counters c ON qi.counter_id = c.id
      WHERE qi.created_at::date = $1::date
    `;
        const params = [today];
        let paramIndex = 2;

        if (department_id) {
            query += ` AND qi.department_id = $${paramIndex}`;
            params.push(department_id);
            paramIndex++;
        }

        if (status) {
            query += ` AND qi.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Sort: emergency first, then elderly, then normal. Within each, by created_at.
        query += `
      ORDER BY
        CASE qi.priority
          WHEN 'emergency' THEN 0
          WHEN 'elderly' THEN 1
          ELSE 2
        END ASC,
        qi.created_at ASC
    `;

        const { rows } = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching active queue:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Call next patient for a specific counter.
 * Picks the highest priority waiting patient in the counter's department.
 */
exports.callNext = async (req, res) => {
    const { counter_id } = req.body;

    if (!counter_id) {
        return res.status(400).json({
            success: false,
            message: 'Field "counter_id" is required.'
        });
    }

    try {
        // Get the counter's department
        const counterResult = await db.query(
            'SELECT * FROM counters WHERE id = $1',
            [counter_id]
        );

        if (counterResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Counter not found' });
        }

        const counter = counterResult.rows[0];
        const today = new Date().toISOString().split('T')[0];

        // Find next waiting patient (priority ordering)
        const nextPatient = await db.query(
            `SELECT * FROM queue_items
       WHERE department_id = $1
         AND status = 'waiting'
         AND created_at::date = $2::date
       ORDER BY
         CASE priority
           WHEN 'emergency' THEN 0
           WHEN 'elderly' THEN 1
           ELSE 2
         END ASC,
         created_at ASC
       LIMIT 1`,
            [counter.department_id, today]
        );

        if (nextPatient.rows.length === 0) {
            return res.json({ success: true, data: null, message: 'No patients waiting.' });
        }

        // Update status to "called" and assign counter
        const updateResult = await db.query(
            `UPDATE queue_items
       SET status = 'called', counter_id = $1, called_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
            [counter_id, nextPatient.rows[0].id]
        );

        // Enrich with department and counter names for display/TTS
        const enriched = {
            ...updateResult.rows[0],
            department_name: null,
            counter_name: counter.name
        };

        const deptResult = await db.query('SELECT name FROM departments WHERE id = $1', [counter.department_id]);
        if (deptResult.rows.length > 0) {
            enriched.department_name = deptResult.rows[0].name;
        }

        res.json({ success: true, data: enriched });
        broadcast('queue:called', enriched);
    } catch (error) {
        console.error('Error calling next patient:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Recall a patient (set status back to "called")
 */
exports.recallPatient = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query(
            `UPDATE queue_items
       SET status = 'called', called_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Queue item not found' });
        }

        res.json({ success: true, data: rows[0] });
        broadcast('queue:recalled', rows[0]);
    } catch (error) {
        console.error('Error recalling patient:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Skip a patient
 */
exports.skipPatient = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query(
            `UPDATE queue_items SET status = 'skipped' WHERE id = $1 RETURNING *`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Queue item not found' });
        }

        res.json({ success: true, data: rows[0] });
        broadcast('queue:skipped', rows[0]);
    } catch (error) {
        console.error('Error skipping patient:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Mark patient as serving (operator started handling the patient)
 */
exports.servePatient = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query(
            `UPDATE queue_items
       SET status = 'serving', served_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Queue item not found' });
        }

        res.json({ success: true, data: rows[0] });
        broadcast('queue:served', rows[0]);
    } catch (error) {
        console.error('Error serving patient:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Complete a patient (done serving)
 */
exports.completePatient = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await db.query(
            `UPDATE queue_items
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Queue item not found' });
        }

        res.json({ success: true, data: rows[0] });
        broadcast('queue:completed', rows[0]);
    } catch (error) {
        console.error('Error completing patient:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Transfer a queue item to a different counter
 */
exports.transferQueue = async (req, res) => {
    const { id } = req.params;
    const { counter_id } = req.body;

    if (!counter_id) {
        return res.status(400).json({
            success: false,
            message: 'Field "counter_id" is required.'
        });
    }

    try {
        const { rows } = await db.query(
            `UPDATE queue_items
       SET counter_id = $1, status = 'waiting', called_at = NULL
       WHERE id = $2
       RETURNING *`,
            [counter_id, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Queue item not found' });
        }

        res.json({ success: true, data: rows[0], message: 'Patient transferred.' });
    } catch (error) {
        console.error('Error transferring queue:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ---------- Analytics ----------

/**
 * Get today's queue statistics
 */
exports.getStats = async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { department_id } = req.query;

    try {
        let departmentFilter = '';
        const params = [today];

        if (department_id) {
            departmentFilter = ' AND department_id = $2';
            params.push(department_id);
        }

        // Total counts by status
        const statusQuery = `
      SELECT status, COUNT(*) AS count
      FROM queue_items
      WHERE created_at::date = $1::date ${departmentFilter}
      GROUP BY status
    `;
        const statusResult = await db.query(statusQuery, params);

        // Average wait time (for completed patients)
        const avgWaitQuery = `
      SELECT AVG(EXTRACT(EPOCH FROM (called_at - created_at))) AS avg_wait_seconds
      FROM queue_items
      WHERE created_at::date = $1::date
        AND called_at IS NOT NULL
        ${departmentFilter}
    `;
        const avgWaitResult = await db.query(avgWaitQuery, params);

        // Build summary
        const statusMap = {};
        statusResult.rows.forEach((row) => {
            statusMap[row.status] = parseInt(row.count, 10);
        });

        const totalServed = (statusMap.completed || 0) + (statusMap.serving || 0);
        const totalWaiting = statusMap.waiting || 0;
        const totalCalled = statusMap.called || 0;
        const totalSkipped = statusMap.skipped || 0;
        const avgWaitSeconds = avgWaitResult.rows[0]?.avg_wait_seconds || 0;

        res.json({
            success: true,
            data: {
                total_served: totalServed,
                total_waiting: totalWaiting,
                total_called: totalCalled,
                total_skipped: totalSkipped,
                avg_wait_minutes: Math.round(avgWaitSeconds / 60),
                by_status: statusMap
            }
        });
    } catch (error) {
        console.error('Error fetching queue stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get display board data (for public TV screen)
 * Returns current serving + next up items
 */
exports.getDisplayBoard = async (req, res) => {
    const { department_id } = req.query;
    const today = new Date().toISOString().split('T')[0];

    try {
        let departmentFilter = '';
        const params = [today];

        if (department_id) {
            departmentFilter = ' AND qi.department_id = $2';
            params.push(department_id);
        }

        // Currently being called or served
        const servingQuery = `
      SELECT qi.*, d.name AS department_name, c.name AS counter_name
      FROM queue_items qi
      LEFT JOIN departments d ON qi.department_id = d.id
      LEFT JOIN counters c ON qi.counter_id = c.id
      WHERE qi.created_at::date = $1::date
        AND qi.status IN ('called', 'serving')
        ${departmentFilter}
      ORDER BY qi.called_at DESC
    `;
        const servingResult = await db.query(servingQuery, params);

        // Upcoming (waiting)
        const waitingQuery = `
      SELECT qi.*, d.name AS department_name
      FROM queue_items qi
      LEFT JOIN departments d ON qi.department_id = d.id
      WHERE qi.created_at::date = $1::date
        AND qi.status = 'waiting'
        ${departmentFilter}
      ORDER BY
        CASE qi.priority
          WHEN 'emergency' THEN 0
          WHEN 'elderly' THEN 1
          ELSE 2
        END ASC,
        qi.created_at ASC
      LIMIT 10
    `;
        const waitingResult = await db.query(waitingQuery, params);

        // Waiting count
        const countQuery = `
      SELECT COUNT(*) AS total
      FROM queue_items
      WHERE created_at::date = $1::date
        AND status = 'waiting'
        ${department_id ? ' AND department_id = $2' : ''}
    `;
        const countResult = await db.query(countQuery, params);

        res.json({
            success: true,
            data: {
                now_serving: servingResult.rows,
                next_up: waitingResult.rows,
                waiting_count: parseInt(countResult.rows[0].total, 10)
            }
        });
    } catch (error) {
        console.error('Error fetching display board:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
