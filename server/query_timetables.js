const pool = require('./src/config/db');

async function check() {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.class_id, t.day_of_week, t.period_id, s.name as subject_name, r.name as resource_name 
      FROM timetables t 
      LEFT JOIN subjects s ON t.subject_id = s.id 
      LEFT JOIN resources r ON t.resource_id = r.id 
      WHERE r.name LIKE '%Lab%'
    `);
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
