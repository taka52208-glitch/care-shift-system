import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/shift.db');

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  db.exec(`
    -- Staff table
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      qualification TEXT NOT NULL,
      employment_type TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Shift patterns table
    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      break_time INTEGER NOT NULL DEFAULT 60,
      color TEXT NOT NULL DEFAULT '#3b82f6'
    );

    -- Shifts table
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      date TEXT NOT NULL,
      pattern_id TEXT NOT NULL,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (pattern_id) REFERENCES patterns(id),
      UNIQUE(staff_id, date)
    );

    -- Shift requests table
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      date TEXT NOT NULL,
      request_type TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );

    -- Constraints table
    CREATE TABLE IF NOT EXISTS constraints (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Insert default patterns if not exists
  const patternCount = db.prepare('SELECT COUNT(*) as count FROM patterns').get() as { count: number };
  if (patternCount.count === 0) {
    const insertPattern = db.prepare(`
      INSERT INTO patterns (id, name, code, start_time, end_time, break_time, color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertPattern.run('1', '早番', 'E', '07:00', '16:00', 60, '#fbbf24');
    insertPattern.run('2', '日勤', 'D', '09:00', '18:00', 60, '#22c55e');
    insertPattern.run('3', '遅番', 'L', '12:00', '21:00', 60, '#3b82f6');
    insertPattern.run('4', '夜勤', 'N', '21:00', '07:00', 120, '#8b5cf6');
    insertPattern.run('5', '公休', 'O', '-', '-', 0, '#94a3b8');
  }

  // Insert default constraints if not exists
  const constraintCount = db.prepare('SELECT COUNT(*) as count FROM constraints').get() as { count: number };
  if (constraintCount.count === 0) {
    const insertConstraint = db.prepare(`
      INSERT INTO constraints (id, category, key, value) VALUES (?, ?, ?, ?)
    `);
    insertConstraint.run('1', 'staffing', 'minDayStaff', '3');
    insertConstraint.run('2', 'staffing', 'minNightStaff', '2');
    insertConstraint.run('3', 'staffing', 'minQualifiedDay', '1');
    insertConstraint.run('4', 'workLimit', 'maxConsecutiveDays', '5');
    insertConstraint.run('5', 'workLimit', 'maxNightShifts', '8');
    insertConstraint.run('6', 'workLimit', 'restAfterNight', '1');
    insertConstraint.run('7', 'holiday', 'weeklyHolidays', '2');
    insertConstraint.run('8', 'holiday', 'minMonthlyHolidays', '8');
  }

  // Insert sample staff if not exists
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number };
  if (staffCount.count === 0) {
    const insertStaff = db.prepare(`
      INSERT INTO staff (id, name, qualification, employment_type, phone, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    insertStaff.run('1', '山田太郎', '介護福祉士', '正社員', '090-1234-5678');
    insertStaff.run('2', '佐藤花子', 'ヘルパー2級', 'パート', '090-2345-6789');
    insertStaff.run('3', '鈴木一郎', '介護福祉士', '正社員', '090-3456-7890');
    insertStaff.run('4', '田中美咲', 'ヘルパー2級', 'パート', '090-4567-8901');
    insertStaff.run('5', '高橋健二', '介護福祉士', '正社員', '090-5678-9012');
  }

  // Insert default admin user if not exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('1', 'admin@example.com', hashedPassword, '管理者', 'admin');
  }

  console.log('Database initialized');
}
