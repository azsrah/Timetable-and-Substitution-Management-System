const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function initDB() {
  try {
    // Connect without DB to create it first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'timetable_management';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created or already exists.`);

    await connection.query(`USE \`${dbName}\``);

    // Create Tables
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Teacher', 'Student') NOT NULL,
        contact_info VARCHAR(255),
        is_temporary_teacher BOOLEAN DEFAULT FALSE,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grade INT NOT NULL,
        section VARCHAR(10) NOT NULL,
        room_number VARCHAR(50)
      )`,
      `CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS class_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        subject_id INT NOT NULL,
        assigned_teacher_id INT,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_teacher_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS periods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_break BOOLEAN DEFAULT FALSE
      )`,
      `CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('Lab', 'Ground', 'Auditorium') NOT NULL,
        capacity INT DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS timetables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
        period_id INT NOT NULL,
        subject_id INT NOT NULL,
        teacher_id INT NOT NULL,
        resource_id INT NULL,
        is_locked BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS resource_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        resource_id INT NOT NULL,
        date DATE NOT NULL,
        period_id INT NOT NULL,
        status ENUM('Pending', 'Approved', 'Rescheduled', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
        FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('Present', 'Absent', 'Leave') NOT NULL,
        user_type ENUM('Teacher', 'Student') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS substitutions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        absent_teacher_id INT NOT NULL,
        substitute_teacher_id INT NOT NULL,
        timetable_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (absent_teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (substitute_teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (timetable_id) REFERENCES timetables(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        target_audience ENUM('All', 'Admins', 'Teachers', 'Students') DEFAULT 'All',
        scheduled_for DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(100),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    for (let query of queries) {
      await connection.query(query);
    }
    console.log("All tables created successfully.");
    
    // Create Default Admin
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const [adminExist] = await connection.query(`SELECT * FROM users WHERE email = 'admin@school.com'`);
    if (adminExist.length === 0) {
      await connection.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
        ['Super Admin', 'admin@school.com', adminPassword, 'Admin']
      );
      console.log("Default Admin created: admin@school.com / admin123");
    }

    await connection.end();
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

initDB();
