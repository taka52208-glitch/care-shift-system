import bcrypt from 'bcryptjs';

// In-memory data storage
interface Tables {
  staff: Record<string, unknown>[];
  patterns: Record<string, unknown>[];
  shifts: Record<string, unknown>[];
  requests: Record<string, unknown>[];
  constraints: Record<string, unknown>[];
  users: Record<string, unknown>[];
}

const tables: Tables = {
  staff: [],
  patterns: [],
  shifts: [],
  requests: [],
  constraints: [],
  users: []
};

// Simple query helper that mimics better-sqlite3 API
export const db = {
  prepare: (sql: string) => {
    return {
      run: (...params: unknown[]) => {
        const result = executeQuery(sql, params);
        return { changes: result.changes };
      },
      get: (...params: unknown[]) => {
        const result = executeQuery(sql, params);
        return result.rows[0];
      },
      all: (...params: unknown[]) => {
        const result = executeQuery(sql, params);
        return result.rows;
      }
    };
  },
  exec: (_sql: string) => {
    // For CREATE TABLE statements, just ignore (tables already exist)
  }
};

function executeQuery(sql: string, params: unknown[]): { rows: Record<string, unknown>[]; changes: number } {
  const sqlLower = sql.toLowerCase().trim();

  if (sqlLower.startsWith('select')) {
    return handleSelect(sql, params);
  }
  if (sqlLower.startsWith('insert')) {
    return handleInsert(sql, params);
  }
  if (sqlLower.startsWith('update')) {
    return handleUpdate(sql, params);
  }
  if (sqlLower.startsWith('delete')) {
    return handleDelete(sql, params);
  }

  return { rows: [], changes: 0 };
}

function getTableName(sql: string): keyof Tables | null {
  const tablesList: (keyof Tables)[] = ['staff', 'patterns', 'shifts', 'requests', 'constraints', 'users'];
  for (const table of tablesList) {
    if (sql.toLowerCase().includes(table)) {
      return table;
    }
  }
  return null;
}

function handleSelect(sql: string, params: unknown[]): { rows: Record<string, unknown>[]; changes: number } {
  const tableName = getTableName(sql);
  if (!tableName) return { rows: [], changes: 0 };

  let rows = [...tables[tableName]];

  if (sql.toLowerCase().includes('where')) {
    const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
    if (whereMatch && params.length > 0) {
      const field = whereMatch[1];
      rows = rows.filter(row => row[field] === params[0]);
    }
  }

  if (sql.toLowerCase().includes('order by')) {
    const orderMatch = sql.match(/order by\s+(\w+)/i);
    if (orderMatch) {
      const field = orderMatch[1];
      rows.sort((a, b) => String(a[field] || '').localeCompare(String(b[field] || '')));
    }
  }

  return { rows, changes: 0 };
}

function handleInsert(sql: string, params: unknown[]): { rows: Record<string, unknown>[]; changes: number } {
  const tableName = getTableName(sql);
  if (!tableName) return { rows: [], changes: 0 };

  const colMatch = sql.match(/\(([^)]+)\)\s*values/i);
  if (!colMatch) return { rows: [], changes: 0 };

  const columns = colMatch[1].split(',').map(c => c.trim());
  const row: Record<string, unknown> = {};

  columns.forEach((col, i) => {
    row[col] = params[i] !== undefined ? params[i] : null;
  });

  tables[tableName].push(row);
  return { rows: [], changes: 1 };
}

function handleUpdate(sql: string, params: unknown[]): { rows: Record<string, unknown>[]; changes: number } {
  const tableName = getTableName(sql);
  if (!tableName) return { rows: [], changes: 0 };

  const setMatch = sql.match(/set\s+(.+?)\s+where/i);
  if (!setMatch) return { rows: [], changes: 0 };

  const setClauses = setMatch[1].split(',').map(c => c.trim().split('=')[0].trim());

  const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
  if (!whereMatch) return { rows: [], changes: 0 };

  const whereField = whereMatch[1];
  const whereValue = params[params.length - 1];

  let changes = 0;
  tables[tableName].forEach(row => {
    if (row[whereField] === whereValue) {
      setClauses.forEach((col, i) => {
        row[col] = params[i];
      });
      changes++;
    }
  });

  return { rows: [], changes };
}

function handleDelete(sql: string, params: unknown[]): { rows: Record<string, unknown>[]; changes: number } {
  const tableName = getTableName(sql);
  if (!tableName) return { rows: [], changes: 0 };

  const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
  if (!whereMatch) return { rows: [], changes: 0 };

  const field = whereMatch[1];
  const value = params[0];

  const initialLength = tables[tableName].length;
  tables[tableName] = tables[tableName].filter(row => row[field] !== value);

  return { rows: [], changes: initialLength - tables[tableName].length };
}

export function initDatabase() {
  if (tables.patterns.length === 0) {
    tables.patterns.push(
      { id: '1', name: '早番', code: 'E', start_time: '07:00', end_time: '16:00', break_time: 60, color: '#fbbf24' },
      { id: '2', name: '日勤', code: 'D', start_time: '09:00', end_time: '18:00', break_time: 60, color: '#22c55e' },
      { id: '3', name: '遅番', code: 'L', start_time: '12:00', end_time: '21:00', break_time: 60, color: '#3b82f6' },
      { id: '4', name: '夜勤', code: 'N', start_time: '21:00', end_time: '07:00', break_time: 120, color: '#8b5cf6' },
      { id: '5', name: '公休', code: 'O', start_time: '-', end_time: '-', break_time: 0, color: '#94a3b8' }
    );
  }

  if (tables.constraints.length === 0) {
    tables.constraints.push(
      { id: '1', category: 'staffing', key: 'minDayStaff', value: '3' },
      { id: '2', category: 'staffing', key: 'minNightStaff', value: '2' },
      { id: '3', category: 'staffing', key: 'minQualifiedDay', value: '1' },
      { id: '4', category: 'workLimit', key: 'maxConsecutiveDays', value: '5' },
      { id: '5', category: 'workLimit', key: 'maxNightShifts', value: '8' },
      { id: '6', category: 'workLimit', key: 'restAfterNight', value: '1' },
      { id: '7', category: 'holiday', key: 'weeklyHolidays', value: '2' },
      { id: '8', category: 'holiday', key: 'minMonthlyHolidays', value: '8' }
    );
  }

  if (tables.staff.length === 0) {
    const now = new Date().toISOString();
    tables.staff.push(
      { id: '1', name: '山田太郎', qualification: '介護福祉士', employment_type: '正社員', phone: '090-1234-5678', email: null, created_at: now },
      { id: '2', name: '佐藤花子', qualification: 'ヘルパー2級', employment_type: 'パート', phone: '090-2345-6789', email: null, created_at: now },
      { id: '3', name: '鈴木一郎', qualification: '介護福祉士', employment_type: '正社員', phone: '090-3456-7890', email: null, created_at: now },
      { id: '4', name: '田中美咲', qualification: 'ヘルパー2級', employment_type: 'パート', phone: '090-4567-8901', email: null, created_at: now },
      { id: '5', name: '高橋健二', qualification: '介護福祉士', employment_type: '正社員', phone: '090-5678-9012', email: null, created_at: now }
    );
  }

  if (tables.users.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const now = new Date().toISOString();
    tables.users.push({
      id: '1',
      email: 'admin@example.com',
      password: hashedPassword,
      name: '管理者',
      role: 'admin',
      created_at: now
    });
  }

  console.log('Database initialized (in-memory store)');
}
