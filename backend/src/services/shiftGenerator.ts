import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

interface Staff {
  id: string;
  name: string;
  qualification: string;
  employment_type: string;
}

interface ShiftPattern {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
}

interface Constraint {
  key: string;
  value: number;
}

interface ShiftRequest {
  staff_id: string;
  date: string;
  request_type: string;
  status: string;
}

interface GeneratedShift {
  id: string;
  staffId: string;
  date: string;
  patternId: string;
}

interface GenerationResult {
  success: boolean;
  shiftsGenerated: number;
  warnings: string[];
  errors: string[];
}

// Get constraints as a map
function getConstraints(): Map<string, number> {
  const rows = db.prepare('SELECT key, value FROM constraints').all() as Constraint[];
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.key, Number(row.value));
  }
  return map;
}

// Get approved requests for a month
function getApprovedRequests(month: string): Map<string, Set<string>> {
  const rows = db.prepare(`
    SELECT staff_id, date FROM requests
    WHERE status = 'approved' AND date LIKE ?
  `).all(`${month}%`) as ShiftRequest[];

  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!map.has(row.staff_id)) {
      map.set(row.staff_id, new Set());
    }
    map.get(row.staff_id)!.add(row.date);
  }
  return map;
}

// Get existing shifts for a month
function getExistingShifts(month: string): Map<string, Map<string, string>> {
  const rows = db.prepare(`
    SELECT staff_id, date, pattern_id FROM shifts WHERE date LIKE ?
  `).all(`${month}%`) as { staff_id: string; date: string; pattern_id: string }[];

  const map = new Map<string, Map<string, string>>();
  for (const row of rows) {
    if (!map.has(row.staff_id)) {
      map.set(row.staff_id, new Map());
    }
    map.get(row.staff_id)!.set(row.date, row.pattern_id);
  }
  return map;
}

// Check if staff is qualified (介護福祉士)
function isQualified(staff: Staff): boolean {
  return staff.qualification === '介護福祉士';
}

// Check if pattern is a night shift
function isNightShift(patternId: string): boolean {
  return patternId === '4'; // N: 夜勤
}

// Check if pattern is a day off
function isDayOff(patternId: string): boolean {
  return patternId === '5'; // O: 公休
}

// Count consecutive work days ending on a date
function countConsecutiveWorkDays(
  staffShifts: Map<string, string>,
  date: string,
  daysInMonth: number,
  year: number,
  monthNum: number
): number {
  let count = 0;
  const currentDate = new Date(date);

  for (let i = 0; i < 10; i++) { // Check up to 10 days back
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const patternId = staffShifts.get(dateStr);
    if (patternId && !isDayOff(patternId)) {
      count++;
    } else {
      break;
    }
  }

  return count;
}

// Count night shifts in the month
function countNightShifts(staffShifts: Map<string, string>): number {
  let count = 0;
  for (const patternId of staffShifts.values()) {
    if (isNightShift(patternId)) {
      count++;
    }
  }
  return count;
}

// Count day offs in the month
function countDayOffs(staffShifts: Map<string, string>): number {
  let count = 0;
  for (const patternId of staffShifts.values()) {
    if (isDayOff(patternId)) {
      count++;
    }
  }
  return count;
}

// Check if staff worked night shift on previous day
function workedNightYesterday(
  staffShifts: Map<string, string>,
  date: string
): boolean {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  return isNightShift(staffShifts.get(yesterdayStr) || '');
}

// Generate shifts for a month
export function generateShifts(month: string): GenerationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const generatedShifts: GeneratedShift[] = [];

  // Parse month
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // Load data
  const staffList = db.prepare('SELECT * FROM staff').all() as Staff[];
  const patterns = db.prepare('SELECT * FROM patterns').all() as ShiftPattern[];
  const constraints = getConstraints();
  const approvedRequests = getApprovedRequests(month);
  const existingShifts = getExistingShifts(month);

  // Get constraint values
  const minDayStaff = constraints.get('minDayStaff') || 3;
  const minNightStaff = constraints.get('minNightStaff') || 2;
  const minQualifiedDay = constraints.get('minQualifiedDay') || 1;
  const maxConsecutiveDays = constraints.get('maxConsecutiveDays') || 5;
  const maxNightShifts = constraints.get('maxNightShifts') || 8;
  const restAfterNight = constraints.get('restAfterNight') || 1;
  const minMonthlyHolidays = constraints.get('minMonthlyHolidays') || 8;

  // Get pattern IDs
  const dayPatterns = patterns.filter(p => !['N', 'O'].includes(p.code)).map(p => p.id);
  const nightPatternId = patterns.find(p => p.code === 'N')?.id || '4';
  const offPatternId = patterns.find(p => p.code === 'O')?.id || '5';

  // Initialize staff shift tracking
  const staffShiftMap = new Map<string, Map<string, string>>();
  for (const staff of staffList) {
    const existing = existingShifts.get(staff.id) || new Map();
    staffShiftMap.set(staff.id, new Map(existing));
  }

  // Process each day
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;

    // Track assignments for this day
    let dayStaffCount = 0;
    let nightStaffCount = 0;
    let qualifiedDayCount = 0;
    const assignedToday = new Set<string>();

    // First, count existing shifts
    for (const staff of staffList) {
      const staffShifts = staffShiftMap.get(staff.id)!;
      const existingPattern = staffShifts.get(dateStr);

      if (existingPattern) {
        assignedToday.add(staff.id);
        if (isNightShift(existingPattern)) {
          nightStaffCount++;
        } else if (!isDayOff(existingPattern)) {
          dayStaffCount++;
          if (isQualified(staff)) {
            qualifiedDayCount++;
          }
        }
      }
    }

    // Assign shifts to unassigned staff
    const unassignedStaff = staffList.filter(s => !assignedToday.has(s.id));

    // Shuffle for fairness
    const shuffled = [...unassignedStaff].sort(() => Math.random() - 0.5);

    for (const staff of shuffled) {
      const staffShifts = staffShiftMap.get(staff.id)!;
      const staffRequests = approvedRequests.get(staff.id);

      // Check if staff requested day off
      if (staffRequests?.has(dateStr)) {
        staffShifts.set(dateStr, offPatternId);
        generatedShifts.push({
          id: uuidv4(),
          staffId: staff.id,
          date: dateStr,
          patternId: offPatternId
        });
        continue;
      }

      // Check constraints
      const consecutiveDays = countConsecutiveWorkDays(staffShifts, dateStr, daysInMonth, year, monthNum);
      const nightShiftCount = countNightShifts(staffShifts);
      const dayOffCount = countDayOffs(staffShifts);
      const needsRestAfterNight = workedNightYesterday(staffShifts, dateStr);

      // Determine if we should assign day off
      const remainingDays = daysInMonth - day + 1;
      const neededDayOffs = minMonthlyHolidays - dayOffCount;
      const mustTakeDayOff = neededDayOffs >= remainingDays;
      const shouldConsiderDayOff = consecutiveDays >= maxConsecutiveDays || needsRestAfterNight || mustTakeDayOff;

      if (shouldConsiderDayOff) {
        staffShifts.set(dateStr, offPatternId);
        generatedShifts.push({
          id: uuidv4(),
          staffId: staff.id,
          date: dateStr,
          patternId: offPatternId
        });
        continue;
      }

      // Try to assign night shift if needed
      if (nightStaffCount < minNightStaff && nightShiftCount < maxNightShifts && !needsRestAfterNight) {
        staffShifts.set(dateStr, nightPatternId);
        generatedShifts.push({
          id: uuidv4(),
          staffId: staff.id,
          date: dateStr,
          patternId: nightPatternId
        });
        nightStaffCount++;
        continue;
      }

      // Assign day shift if needed
      if (dayStaffCount < minDayStaff || (qualifiedDayCount < minQualifiedDay && isQualified(staff))) {
        // Pick a random day pattern (早番, 日勤, 遅番)
        const patternId = dayPatterns[Math.floor(Math.random() * dayPatterns.length)];
        staffShifts.set(dateStr, patternId);
        generatedShifts.push({
          id: uuidv4(),
          staffId: staff.id,
          date: dateStr,
          patternId
        });
        dayStaffCount++;
        if (isQualified(staff)) {
          qualifiedDayCount++;
        }
        continue;
      }

      // Otherwise, give a day off if we have enough staff
      if (dayStaffCount >= minDayStaff && nightStaffCount >= minNightStaff) {
        staffShifts.set(dateStr, offPatternId);
        generatedShifts.push({
          id: uuidv4(),
          staffId: staff.id,
          date: dateStr,
          patternId: offPatternId
        });
      } else {
        // Assign a day shift
        const patternId = dayPatterns[Math.floor(Math.random() * dayPatterns.length)];
        staffShifts.set(dateStr, patternId);
        generatedShifts.push({
          id: uuidv4(),
          staffId: staff.id,
          date: dateStr,
          patternId
        });
        dayStaffCount++;
        if (isQualified(staff)) {
          qualifiedDayCount++;
        }
      }
    }

    // Validate day constraints
    if (dayStaffCount < minDayStaff) {
      warnings.push(`${dateStr}: 日勤スタッフが不足 (${dayStaffCount}/${minDayStaff})`);
    }
    if (nightStaffCount < minNightStaff) {
      warnings.push(`${dateStr}: 夜勤スタッフが不足 (${nightStaffCount}/${minNightStaff})`);
    }
    if (qualifiedDayCount < minQualifiedDay) {
      warnings.push(`${dateStr}: 有資格者が不足 (${qualifiedDayCount}/${minQualifiedDay})`);
    }
  }

  // Save generated shifts to database
  const insert = db.prepare(`
    INSERT OR REPLACE INTO shifts (id, staff_id, date, pattern_id)
    VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction((shifts: GeneratedShift[]) => {
    for (const shift of shifts) {
      insert.run(shift.id, shift.staffId, shift.date, shift.patternId);
    }
  });

  try {
    transaction(generatedShifts);
  } catch (e) {
    errors.push(`データベース保存エラー: ${e}`);
    return { success: false, shiftsGenerated: 0, warnings, errors };
  }

  return {
    success: true,
    shiftsGenerated: generatedShifts.length,
    warnings,
    errors
  };
}

// Clear shifts for a month (before regenerating)
export function clearShifts(month: string): number {
  const result = db.prepare('DELETE FROM shifts WHERE date LIKE ?').run(`${month}%`);
  return result.changes;
}
