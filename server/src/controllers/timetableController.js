const pool = require('../config/db');

// Get all periods
exports.getAllPeriods = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM periods ORDER BY start_time');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get weekly timetable for a class with substitutions overlay
exports.getClassTimetable = async (req, res) => {
  const { classId } = req.params;
  try {
    // 1. Get base timetable
    const [baseRows] = await pool.query(`
      SELECT t.id, t.day_of_week, t.period_id, p.name as period_name, p.start_time, p.end_time, p.is_break,
             s.name as subject_name, u.name as teacher_name, r.name as resource_name, t.is_locked
      FROM timetables t
      JOIN periods p ON t.period_id = p.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN users u ON t.teacher_id = u.id
      LEFT JOIN resources r ON t.resource_id = r.id
      WHERE t.class_id = ?
      ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), p.start_time
    `, [classId]);

    // 2. Get substitutions for the CURRENT week (Monday to Sunday)
    const now = new Date();
    const day = now.getDay(); 
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    const [subRows] = await pool.query(`
      SELECT s.timetable_id, s.date, u.name as substitute_teacher_name, s.status
      FROM substitutions s
      JOIN users u ON s.substitute_teacher_id = u.id
      WHERE s.date BETWEEN ? AND ? AND s.status = 'Accepted'
      AND s.timetable_id IN (SELECT id FROM timetables WHERE class_id = ?)
    `, [monday, sunday, classId]);

    const merged = baseRows.map(row => {
      const daySubs = subRows.filter(s => {
        const subDate = new Date(s.date);
        const subDayName = subDate.toLocaleDateString('en-US', { weekday: 'long' });
        return subDayName.toLowerCase() === row.day_of_week.toLowerCase() && s.timetable_id === row.id;
      });

      if (daySubs.length > 0) {
        return { 
          ...row, 
          substitute_teacher: daySubs[0].substitute_teacher_name,
          substitution_date: daySubs[0].date
        };
      }
      return row;
    });

    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get weekly timetable for a teacher
exports.getTeacherTimetable = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.day_of_week, p.name as period_name, p.start_time, p.end_time, p.is_break,
             s.name as subject_name, c.grade, c.section, r.name as resource_name, t.is_locked, t.period_id
      FROM timetables t
      JOIN periods p ON t.period_id = p.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN classes c ON t.class_id = c.id
      LEFT JOIN resources r ON t.resource_id = r.id
      WHERE t.teacher_id = ?
      ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), p.start_time
    `, [teacherId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add or Update a Timetable Slot WITH Conflict Detection & SL Constraints
exports.saveTimetableSlot = async (req, res) => {
  const { class_id, day_of_week, period_id, subject_id, teacher_id, resource_id, is_double_period } = req.body;
  
  try {
    // 1. Specialist Room Constraint Check
    const [subject] = await pool.query('SELECT required_resource_type FROM subjects WHERE id = ?', [subject_id]);
    const reqType = subject[0]?.required_resource_type || 'None';

    if (reqType !== 'None' && resource_id) {
      const [resource] = await pool.query('SELECT type FROM resources WHERE id = ?', [resource_id]);
      if (resource[0]?.type !== reqType) {
        return res.status(400).json({ message: `This subject requires a ${reqType} room.` });
      }
    } else if (reqType !== 'None' && !resource_id) {
      return res.status(400).json({ message: `This subject MUST be scheduled in a ${reqType} room.` });
    }

    // 2. Conflict Check
    const [teacherConflict] = await pool.query(
      'SELECT id, class_id FROM timetables WHERE teacher_id = ? AND day_of_week = ? AND period_id = ?',
      [teacher_id, day_of_week, period_id]
    );
    
    if (teacherConflict.length > 0 && teacherConflict[0].class_id !== class_id) {
      return res.status(409).json({ message: 'Teacher is already booked for this period.' });
    }

    if (resource_id) {
      const [resourceConflict] = await pool.query(
        'SELECT id, class_id FROM timetables WHERE resource_id = ? AND day_of_week = ? AND period_id = ?',
        [resource_id, day_of_week, period_id]
      );
      if (resourceConflict.length > 0 && resourceConflict[0].class_id !== class_id) {
        return res.status(409).json({ message: 'Resource is already booked for this period.' });
      }
    }

    // 3. Double Period logic
    if (is_double_period) {
        const [periods] = await pool.query('SELECT id FROM periods ORDER BY start_time');
        const currentIndex = periods.findIndex(p => p.id == period_id);
        if (currentIndex !== -1 && currentIndex < periods.length - 1) {
            const nextPeriodId = periods[currentIndex + 1].id;
            const [nextTeacherConflict] = await pool.query(
                'SELECT id FROM timetables WHERE teacher_id = ? AND day_of_week = ? AND period_id = ?',
                [teacher_id, day_of_week, nextPeriodId]
            );
            if (nextTeacherConflict.length > 0 && nextTeacherConflict[0].class_id !== class_id) {
                return res.status(409).json({ message: 'Teacher is booked in the subsequent period needed for the double period.' });
            }
        }
    }

    // 4. Upsert slot
    const [existingSlot] = await pool.query(
      'SELECT id, is_locked FROM timetables WHERE class_id = ? AND day_of_week = ? AND period_id = ?',
      [class_id, day_of_week, period_id]
    );

    if (existingSlot.length > 0) {
      if (existingSlot[0].is_locked) return res.status(403).json({ message: 'This timetable slot is locked.' });
      await pool.query(
        'UPDATE timetables SET subject_id = ?, teacher_id = ?, resource_id = ?, is_double_period = ? WHERE id = ?',
        [subject_id, teacher_id, resource_id || null, is_double_period ? 1 : 0, existingSlot[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO timetables (class_id, day_of_week, period_id, subject_id, teacher_id, resource_id, is_double_period) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [class_id, day_of_week, period_id, subject_id, teacher_id, resource_id || null, is_double_period ? 1 : 0]
      );
    }
    
    req.io.emit('timetable_updated', { class_id, day_of_week, period_id });
    res.json({ message: 'Timetable slot saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get today's schedule
exports.getTodaySchedule = async (req, res) => {
  const { role, id } = req.params;
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const today = new Date().toISOString().split('T')[0];

  try {
    let baseQuery = '';
    let substitutesQuery = '';
    let params = [];

    if (role === 'Student') {
      baseQuery = `
        SELECT t.id as timetable_id, t.day_of_week, p.name as period_name, p.start_time, p.end_time,
               s.name as subject_name, u.name as teacher_name, c.grade, c.section, t.period_id
        FROM timetables t
        JOIN periods p ON t.period_id = p.id
        JOIN subjects s ON t.subject_id = s.id
        JOIN users u ON t.teacher_id = u.id
        JOIN classes c ON t.class_id = c.id
        WHERE t.class_id = (SELECT class_id FROM users WHERE id = ?) AND t.day_of_week = ?
        ORDER BY p.start_time
      `;
      params = [id, dayName];

      substitutesQuery = `
        SELECT s.timetable_id, u.name as substitute_teacher_name
        FROM substitutions s
        JOIN users u ON s.substitute_teacher_id = u.id
        WHERE s.date = ? AND s.status = 'Accepted'
      `;
    } else if (role === 'Teacher') {
      baseQuery = `
         SELECT t.id as timetable_id, t.day_of_week, p.name as period_name, p.start_time, p.end_time,
                s.name as subject_name, c.grade, c.section, t.period_id, 'Regular' as type
         FROM timetables t
         JOIN periods p ON t.period_id = p.id
         JOIN subjects s ON t.subject_id = s.id
         JOIN classes c ON t.class_id = c.id
         WHERE t.teacher_id = ? AND t.day_of_week = ?
         ORDER BY p.start_time
      `;
      params = [id, dayName];

      substitutesQuery = `
        SELECT s.timetable_id, t.day_of_week, p.name as period_name, p.start_time, p.end_time,
               sub.name as subject_name, c.grade, c.section, t.period_id, 'Substitution' as type
        FROM substitutions s
        JOIN timetables t ON s.timetable_id = t.id
        JOIN periods p ON t.period_id = p.id
        JOIN subjects sub ON t.subject_id = sub.id
        JOIN classes c ON t.class_id = c.id
        WHERE s.substitute_teacher_id = ? AND s.date = ? AND s.status = 'Accepted'
      `;
    }

    const [baseRows] = await pool.query(baseQuery, params);
    
    if (role === 'Student') {
       const [subRows] = await pool.query(substitutesQuery, [today]);
       const merged = baseRows.map(row => {
         const sub = subRows.find(s => s.timetable_id === row.timetable_id);
         if (sub) return { ...row, teacher_name: sub.substitute_teacher_name, is_substituted: true };
         return row;
       });
       return res.json(merged);
    } else {
       const [removals] = await pool.query('SELECT timetable_id FROM substitutions WHERE absent_teacher_id = ? AND date = ? AND status = "Accepted"', [id, today]);
       const removalIds = removals.map(r => r.timetable_id);
       const [subAssignments] = await pool.query(substitutesQuery, [id, today]);
       const filteredBase = baseRows.filter(row => !removalIds.includes(row.timetable_id));
       const merged = [...filteredBase, ...subAssignments].sort((a, b) => a.start_time.localeCompare(b.start_time));
       return res.json(merged);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get workload statistics
exports.getTeacherWorkload = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) as total_periods FROM timetables WHERE teacher_id = ?`, [teacherId]);
    const [doublePeriods] = await pool.query(`SELECT COUNT(*) as double_count FROM timetables WHERE teacher_id = ? AND is_double_period = 1`, [teacherId]);
    const total = rows[0].total_periods + (doublePeriods[0]?.double_count || 0);
    res.json({ teacherId, total_periods: total, limit: 35, status: total > 35 ? 'Overloaded' : 'Normal' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
