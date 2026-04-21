// ─────────────────────────────────────────────────────────
// timetableController.js — Timetable & Schedule Logic
// Handles fetching and saving timetable slots, checking
// conflicts, calculating teacher workloads, and building
// today's personalized schedule for students and teachers.
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');

// ── getAllPeriods ─────────────────────────────────────────
// Returns all time periods (e.g. Period 1: 8:00-8:45) sorted by start time.
// Used to populate dropdowns in the timetable editor.
exports.getAllPeriods = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM periods ORDER BY start_time');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── getClassTimetable ─────────────────────────────────────
// Returns the full weekly timetable for a class.
// Also overlays any accepted substitutions for the current week
// so students see substitute teacher names directly in the grid.
exports.getClassTimetable = async (req, res) => {
  const { classId } = req.params;
  try {
    // Step 1: Fetch the base (regular) timetable for this class
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

    // Step 2: Calculate the current week's Monday-to-Sunday date range
    const now = new Date();
    const day = now.getDay(); 
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust if today is Sunday
    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    // Step 3: Fetch accepted substitutions for this class during the current week
    const [subRows] = await pool.query(`
      SELECT s.timetable_id, s.date, u.name as substitute_teacher_name, s.status
      FROM substitutions s
      JOIN users u ON s.substitute_teacher_id = u.id
      WHERE s.date BETWEEN ? AND ? AND s.status = 'Accepted'
      AND s.timetable_id IN (SELECT id FROM timetables WHERE class_id = ?)
    `, [monday, sunday, classId]);

    // Step 4: Merge substitution data into the base timetable rows
    const merged = baseRows.map(row => {
      // Check if there's a substitution for this specific slot on the matching day
      const daySubs = subRows.filter(s => {
        const subDate = new Date(s.date);
        const subDayName = subDate.toLocaleDateString('en-US', { weekday: 'long' });
        return subDayName.toLowerCase() === row.day_of_week.toLowerCase() && s.timetable_id === row.id;
      });

      // If a substitution exists, add the substitute's name to the row
      if (daySubs.length > 0) {
        return { 
          ...row, 
          substitute_teacher: daySubs[0].substitute_teacher_name,
          substitution_date: daySubs[0].date
        };
      }
      return row; // No substitution — return the original slot
    });

    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── getTeacherTimetable ───────────────────────────────────
// Returns the full weekly timetable for a specific teacher,
// showing which class, period, and subject they teach each day.
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

// ── saveTimetableSlot ─────────────────────────────────────
// Creates or updates a single timetable slot for a class.
// Performs 4 checks before saving:
//   1. Subject-room compatibility (e.g., Science needs a Lab)
//   2. Teacher conflict (teacher already booked elsewhere)
//   3. Resource conflict (resource already booked)
//   4. Double-period conflict check for the next consecutive period
exports.saveTimetableSlot = async (req, res) => {
  const { class_id, day_of_week, period_id, subject_id, teacher_id, resource_id, is_double_period } = req.body;
  
  try {
    // Check 1: Make sure the selected resource matches what this subject requires
    const [subject] = await pool.query('SELECT required_resource_type FROM subjects WHERE id = ?', [subject_id]);
    const reqType = subject[0]?.required_resource_type || 'None';

    if (reqType !== 'None' && resource_id) {
      // Verify the chosen resource is the correct type
      const [resource] = await pool.query('SELECT type FROM resources WHERE id = ?', [resource_id]);
      if (resource[0]?.type !== reqType) {
        return res.status(400).json({ message: `This subject requires a ${reqType} room.` });
      }
    } else if (reqType !== 'None' && !resource_id) {
      // Subject needs a specific room but none was selected
      return res.status(400).json({ message: `This subject MUST be scheduled in a ${reqType} room.` });
    }

    // Check 2: Make sure the teacher isn't already teaching another class at this time
    const [teacherConflict] = await pool.query(
      'SELECT id, class_id FROM timetables WHERE teacher_id = ? AND day_of_week = ? AND period_id = ?',
      [teacher_id, day_of_week, period_id]
    );
    
    if (teacherConflict.length > 0 && teacherConflict[0].class_id !== class_id) {
      return res.status(409).json({ message: 'Teacher is already booked for this period.' });
    }

    // Check 3: Make sure the resource isn't booked for another class at the same time
    if (resource_id) {
      const [resourceConflict] = await pool.query(
        'SELECT id, class_id FROM timetables WHERE resource_id = ? AND day_of_week = ? AND period_id = ?',
        [resource_id, day_of_week, period_id]
      );
      if (resourceConflict.length > 0 && resourceConflict[0].class_id !== class_id) {
        return res.status(409).json({ message: 'Resource is already booked for this period.' });
      }
    }

    // Check 4: For double periods, also verify the NEXT period is free for this teacher
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

    // Step: Check if a slot already exists for this class/day/period (upsert logic)
    const [existingSlot] = await pool.query(
      'SELECT id, is_locked FROM timetables WHERE class_id = ? AND day_of_week = ? AND period_id = ?',
      [class_id, day_of_week, period_id]
    );

    if (existingSlot.length > 0) {
      // Slot exists — update it (but only if it's not locked)
      if (existingSlot[0].is_locked) return res.status(403).json({ message: 'This timetable slot is locked.' });
      await pool.query(
        'UPDATE timetables SET subject_id = ?, teacher_id = ?, resource_id = ?, is_double_period = ? WHERE id = ?',
        [subject_id, teacher_id, resource_id || null, is_double_period ? 1 : 0, existingSlot[0].id]
      );
    } else {
      // Slot doesn't exist — insert a new one
      await pool.query(
        'INSERT INTO timetables (class_id, day_of_week, period_id, subject_id, teacher_id, resource_id, is_double_period) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [class_id, day_of_week, period_id, subject_id, teacher_id, resource_id || null, is_double_period ? 1 : 0]
      );
    }
    
    const slotMessage = `Timetable updated for ${day_of_week}. New class scheduled for period ${period_id}.`;
    
    // Notify all students in the class and the teacher about the timetable change
    try {
      const [students] = await pool.query('SELECT id FROM users WHERE class_id = ? AND role = "Student"', [class_id]);
      if (students.length > 0) {
        // Bulk insert one notification per student
        const studentNotifs = students.map(s => [s.id, slotMessage, 'TimetableUpdate']);
        await pool.query('INSERT INTO notifications (user_id, message, type) VALUES ?', [studentNotifs]);
      }
      
      // Also notify the assigned teacher
      await pool.query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
        [teacher_id, `You have a new class scheduled for Class ${class_id} on ${day_of_week}.`, 'TimetableUpdate']
      );
    } catch (err) {
      console.error('Failed to notify users of timetable update:', err);
    }

    // Emit a real-time Socket.io event so the frontend refreshes the timetable instantly
    req.io.emit('timetable_updated', { class_id, day_of_week, period_id });
    res.json({ message: 'Timetable slot saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── getTodaySchedule ──────────────────────────────────────
// Returns the personalized schedule for today for a student or teacher.
// For students: shows class periods and replaces teachers with substitutes if applicable.
// For teachers: shows their regular classes minus any they're absent for,
//               plus any substitution classes they've been assigned today.
exports.getTodaySchedule = async (req, res) => {
  const { role, id } = req.params;
  // Get today's day name (e.g. "Monday") and date string (e.g. "2024-01-15")
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const today = new Date().toISOString().split('T')[0];

  try {
    let baseQuery = '';
    let substitutesQuery = '';
    let params = [];

    if (role === 'Student') {
      // Fetch the student's class schedule for today based on their enrolled class
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

      // Also fetch any accepted substitutions for today to overlay on the schedule
      substitutesQuery = `
        SELECT s.timetable_id, u.name as substitute_teacher_name
        FROM substitutions s
        JOIN users u ON s.substitute_teacher_id = u.id
        WHERE s.date = ? AND s.status = 'Accepted'
      `;
    } else if (role === 'Teacher') {
      // Fetch the teacher's regular classes for today
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

      // Also fetch any substitution classes this teacher is covering today
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
       // Replace teacher names with substitute names where applicable
       const [subRows] = await pool.query(substitutesQuery, [today]);
       const merged = baseRows.map(row => {
         const sub = subRows.find(s => s.timetable_id === row.timetable_id);
         if (sub) return { ...row, teacher_name: sub.substitute_teacher_name, is_substituted: true };
         return row;
       });
       return res.json(merged);
    } else {
       // For teachers: remove periods where they're marked absent, then add their substitution duties
       const [removals] = await pool.query('SELECT timetable_id FROM substitutions WHERE absent_teacher_id = ? AND date = ? AND status = "Accepted"', [id, today]);
       const removalIds = removals.map(r => r.timetable_id);
       const [subAssignments] = await pool.query(substitutesQuery, [id, today]);
       const filteredBase = baseRows.filter(row => !removalIds.includes(row.timetable_id)); // Remove absent periods
       const merged = [...filteredBase, ...subAssignments].sort((a, b) => a.start_time.localeCompare(b.start_time));
       return res.json(merged);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── getTeacherWorkload ────────────────────────────────────
// Calculates the total number of periods a teacher is scheduled for.
// Double periods count as 2. Returns a status of 'Overloaded' if over 35 periods/week.
exports.getTeacherWorkload = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) as total_periods FROM timetables WHERE teacher_id = ?`, [teacherId]);
    const [doublePeriods] = await pool.query(`SELECT COUNT(*) as double_count FROM timetables WHERE teacher_id = ? AND is_double_period = 1`, [teacherId]);
    // Double periods add an extra count since they span two time slots
    const total = rows[0].total_periods + (doublePeriods[0]?.double_count || 0);
    res.json({ teacherId, total_periods: total, limit: 35, status: total > 35 ? 'Overloaded' : 'Normal' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
