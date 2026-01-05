const db = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    // Get patient count
    const patientResult = await db.query('SELECT COUNT(*) as count FROM patients');
    const totalPatients = parseInt(patientResult.rows[0].count);

    // Get today's registrations (if you track dates)
    const today = new Date().toISOString().split('T')[0];
    const todayResult = await db.query(
      'SELECT COUNT(*) as count FROM patients WHERE DATE(created_at) = $1',
      [today]
    );
    const todayPatients = parseInt(todayResult.rows[0].count);

    const stats = [
      { 
        id: '1', 
        title: 'Total Patients Today', 
        value: todayPatients, 
        change: '+12%', 
        trend: 'up', 
        iconName: 'Users', 
        color: 'bg-blue-500' 
      },
      { 
        id: '2', 
        title: 'Appointments Today', 
        value: 24, 
        change: '+5%', 
        trend: 'up', 
        iconName: 'Calendar', 
        color: 'bg-emerald-500' 
      },
      { 
        id: '3', 
        title: 'Available Beds', 
        value: 45, 
        change: '-3', 
        trend: 'down', 
        iconName: 'Activity', 
        color: 'bg-amber-500' 
      },
      { 
        id: '4', 
        title: 'Pending Bills', 
        value: `${totalPatients * 150000}`, 
        change: '+8%', 
        trend: 'up', 
        iconName: 'DollarSign', 
        color: 'bg-rose-500' 
      },
    ];

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

