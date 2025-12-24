import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import bcrypt from 'bcryptjs';

let db: SqlJsDatabase;

// Wrapper to match better-sqlite3 API
export const getDb = () => db;

export const dbWrapper = {
  prepare: (sql: string) => ({
    run: (...params: unknown[]) => {
      db.run(sql, params);
      return { changes: db.getRowsModified() };
    },
    get: (...params: unknown[]) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const row: Record<string, unknown> = {};
        columns.forEach((col, i) => { row[col] = values[i]; });
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: (...params: unknown[]) => {
      const results: Record<string, unknown>[] = [];
      const stmt = db.prepare(sql);
      stmt.bind(params);
      while (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const row: Record<string, unknown> = {};
        columns.forEach((col, i) => { row[col] = values[i]; });
        results.push(row);
      }
      stmt.free();
      return results;
    }
  }),
  exec: (sql: string) => {
    db.run(sql);
  }
};

export { dbWrapper as db };

export async function initDatabase() {
  const SQL = await initSqlJs();
  db = new SQL.Database();

  db.run(`
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

  // Insert default patterns
  const patternCount = dbWrapper.prepare('SELECT COUNT(*) as count FROM patterns').get() as { count: number } | undefined;
  if (!patternCount || patternCount.count === 0) {
    db.run("INSERT INTO patterns (id, name, code, start_time, end_time, break_time, color) VALUES ('1', '早番', 'E', '07:00', '16:00', 60, '#fbbf24')");
    db.run("INSERT INTO patterns (id, name, code, start_time, end_time, break_time, color) VALUES ('2', '日勤', 'D', '09:00', '18:00', 60, '#22c55e')");
    db.run("INSERT INTO patterns (id, name, code, start_time, end_time, break_time, color) VALUES ('3', '遅番', 'L', '12:00', '21:00', 60, '#3b82f6')");
    db.run("INSERT INTO patterns (id, name, code, start_time, end_time, break_time, color) VALUES ('4', '夜勤', 'N', '21:00', '07:00', 120, '#8b5cf6')");
    db.run("INSERT INTO patterns (id, name, code, start_time, end_time, break_time, color) VALUES ('5', '公休', 'O', '-', '-', 0, '#94a3b8')");
  }

  // Insert default constraints
  const constraintCount = dbWrapper.prepare('SELECT COUNT(*) as count FROM constraints').get() as { count: number } | undefined;
  if (!constraintCount || constraintCount.count === 0) {
    db.run("INSERT INTO constraints (id, category, key, value) VALUES ('1', 'staffing', 'minDayStaff', '3')");
    db.run("INSERT INTO constraints (id, category, key, value) VALUES ('2', 'staffing', 'minNightStaff', '2')");
    db.run("INSERT INTO constraints (id, category, key, value) VALUES ('3', 'staffing', 'minQualifiedDay', '1')");
    db.run("INSERT INTO constraints (id, category, key, value) VALUES ('4', 'workLimit', 'maxConsecutiveDays', '5')");
    db.run("INSERT INTO constraints (id, category, key, value) VALUES ('5', 'workLimit', 'maxNightShifts', '8')");
    db.run("INSERT INTO constraints (id, category, key, value) VALUES ('6', 'workLimit', 'restAfterNight', '1')");
    db.run("INSERT INTO constraints (id, category, key, value) VALUES ('7', 'holiday', 'weeklyHolidays', '2')");
    db.run("INSERT INTO constraints (id, category, key, value) VALUES ('8', 'holiday', 'minMonthlyHolidays', '8')");
  }

  // Insert sample staff
  const staffCount = dbWrapper.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number } | undefined;
  if (!staffCount || staffCount.count === 0) {
    db.run("INSERT INTO staff (id, name, qualification, employment_type, phone, created_at) VALUES ('1', '山田太郎', '介護福祉士', '正社員', '090-1234-5678', datetime('now'))");
    db.run("INSERT INTO staff (id, name, qualification, employment_type, phone, created_at) VALUES ('2', '佐藤花子', 'ヘルパー2級', 'パート', '090-2345-6789', datetime('now'))");
    db.run("INSERT INTO staff (id, name, qualification, employment_type, phone, created_at) VALUES ('3', '鈴木一郎', '介護福祉士', '正社員', '090-3456-7890', datetime('now'))");
    db.run("INSERT INTO staff (id, name, qualification, employment_type, phone, created_at) VALUES ('4', '田中美咲', 'ヘルパー2級', 'パート', '090-4567-8901', datetime('now'))");
    db.run("INSERT INTO staff (id, name, qualification, employment_type, phone, created_at) VALUES ('5', '高橋健二', '介護福祉士', '正社員', '090-5678-9012', datetime('now'))");
  }

  // Insert default admin user
  const userCount = dbWrapper.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number } | undefined;
  if (!userCount || userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT INTO users (id, email, password, name, role, created_at) VALUES ('1', 'admin@example.com', '${hashedPassword}', '管理者', 'admin', datetime('now'))`);
  }

  console.log('Database initialized (in-memory with sql.js)');
}
