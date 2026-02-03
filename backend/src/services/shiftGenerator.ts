import { prisma } from '../lib/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import type { Staff, ShiftPattern, Constraint, ShiftRequest, Shift } from '@prisma/client';

interface GeneratedShift {
  id: string;
  tenantId: string;
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

// Check if staff is qualified (介護福祉士)
function isQualified(staff: Staff): boolean {
  return staff.qualification === '介護福祉士';
}

// Check if pattern is a night shift
function isNightShift(pattern: ShiftPattern | undefined): boolean {
  return pattern?.code === 'N';
}

// Check if pattern is a day off
function isDayOff(pattern: ShiftPattern | undefined): boolean {
  return pattern?.code === 'O';
}

// Count consecutive work days ending on a date
function countConsecutiveWorkDays(
  staffShifts: Map<string, ShiftPattern>,
  date: string,
  patterns: Map<string, ShiftPattern>
): number {
  let count = 0;
  const currentDate = new Date(date);

  for (let i = 0; i < 10; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const pattern = staffShifts.get(dateStr);
    if (pattern && !isDayOff(pattern)) {
      count++;
    } else {
      break;
    }
  }

  return count;
}

// Count night shifts in the month
function countNightShifts(staffShifts: Map<string, ShiftPattern>): number {
  let count = 0;
  for (const pattern of staffShifts.values()) {
    if (isNightShift(pattern)) {
      count++;
    }
  }
  return count;
}

// Count day offs in the month
function countDayOffs(staffShifts: Map<string, ShiftPattern>): number {
  let count = 0;
  for (const pattern of staffShifts.values()) {
    if (isDayOff(pattern)) {
      count++;
    }
  }
  return count;
}

// Check if staff worked night shift on previous day
function workedNightYesterday(
  staffShifts: Map<string, ShiftPattern>,
  date: string
): boolean {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  return isNightShift(staffShifts.get(yesterdayStr));
}

// Generate shifts for a month
export async function generateShifts(tenantId: string, month: string): Promise<GenerationResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const generatedShifts: GeneratedShift[] = [];

  try {
    // Parse month
    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    // Load data
    const staffList = await prisma.staff.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    const patternsList = await prisma.shiftPattern.findMany({
      where: { tenantId },
    });

    const constraintsList = await prisma.constraint.findMany({
      where: { tenantId },
    });

    const approvedRequestsList = await prisma.shiftRequest.findMany({
      where: {
        tenantId,
        status: 'APPROVED',
        date: { startsWith: month },
      },
    });

    const existingShiftsList = await prisma.shift.findMany({
      where: {
        tenantId,
        date: { startsWith: month },
      },
    });

    // Convert to maps for easier access
    const patterns = new Map<string, ShiftPattern>();
    for (const pattern of patternsList) {
      patterns.set(pattern.id, pattern);
    }

    const constraints = new Map<string, number>();
    for (const constraint of constraintsList) {
      constraints.set(constraint.key, Number(constraint.value));
    }

    const approvedRequests = new Map<string, Set<string>>();
    for (const request of approvedRequestsList) {
      if (!approvedRequests.has(request.staffId)) {
        approvedRequests.set(request.staffId, new Set());
      }
      approvedRequests.get(request.staffId)!.add(request.date);
    }

    const existingShifts = new Map<string, Map<string, ShiftPattern>>();
    for (const shift of existingShiftsList) {
      if (!existingShifts.has(shift.staffId)) {
        existingShifts.set(shift.staffId, new Map());
      }
      const pattern = patterns.get(shift.patternId);
      if (pattern) {
        existingShifts.get(shift.staffId)!.set(shift.date, pattern);
      }
    }

    // Get constraint values
    const minDayStaff = constraints.get('minDayStaff') || 3;
    const minNightStaff = constraints.get('minNightStaff') || 2;
    const minQualifiedDay = constraints.get('minQualifiedDay') || 1;
    const maxConsecutiveDays = constraints.get('maxConsecutiveDays') || 5;
    const maxNightShifts = constraints.get('maxNightShifts') || 8;
    const restAfterNight = constraints.get('restAfterNight') || 1;
    const minMonthlyHolidays = constraints.get('minMonthlyHolidays') || 8;

    // Get pattern IDs
    const dayPatterns = patternsList.filter(p => !['N', 'O'].includes(p.code));
    const nightPattern = patternsList.find(p => p.code === 'N');
    const offPattern = patternsList.find(p => p.code === 'O');

    if (!nightPattern || !offPattern) {
      errors.push('夜勤または公休パターンが設定されていません');
      return { success: false, shiftsGenerated: 0, warnings, errors };
    }

    // Initialize staff shift tracking
    const staffShiftMap = new Map<string, Map<string, ShiftPattern>>();
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
          staffShifts.set(dateStr, offPattern);
          generatedShifts.push({
            id: uuidv4(),
            tenantId,
            staffId: staff.id,
            date: dateStr,
            patternId: offPattern.id,
          });
          continue;
        }

        // Check constraints
        const consecutiveDays = countConsecutiveWorkDays(staffShifts, dateStr, patterns);
        const nightShiftCount = countNightShifts(staffShifts);
        const dayOffCount = countDayOffs(staffShifts);
        const needsRestAfterNight = workedNightYesterday(staffShifts, dateStr);

        // Determine if we should assign day off
        const remainingDays = daysInMonth - day + 1;
        const neededDayOffs = minMonthlyHolidays - dayOffCount;
        const mustTakeDayOff = neededDayOffs >= remainingDays;
        const shouldConsiderDayOff = consecutiveDays >= maxConsecutiveDays || needsRestAfterNight || mustTakeDayOff;

        if (shouldConsiderDayOff) {
          staffShifts.set(dateStr, offPattern);
          generatedShifts.push({
            id: uuidv4(),
            tenantId,
            staffId: staff.id,
            date: dateStr,
            patternId: offPattern.id,
          });
          continue;
        }

        // Try to assign night shift if needed
        if (nightStaffCount < minNightStaff && nightShiftCount < maxNightShifts && !needsRestAfterNight) {
          staffShifts.set(dateStr, nightPattern);
          generatedShifts.push({
            id: uuidv4(),
            tenantId,
            staffId: staff.id,
            date: dateStr,
            patternId: nightPattern.id,
          });
          nightStaffCount++;
          continue;
        }

        // Assign day shift if needed
        if (dayStaffCount < minDayStaff || (qualifiedDayCount < minQualifiedDay && isQualified(staff))) {
          // Pick a random day pattern (早番, 日勤, 遅番)
          const pattern = dayPatterns[Math.floor(Math.random() * dayPatterns.length)];
          staffShifts.set(dateStr, pattern);
          generatedShifts.push({
            id: uuidv4(),
            tenantId,
            staffId: staff.id,
            date: dateStr,
            patternId: pattern.id,
          });
          dayStaffCount++;
          if (isQualified(staff)) {
            qualifiedDayCount++;
          }
          continue;
        }

        // Otherwise, give a day off if we have enough staff
        if (dayStaffCount >= minDayStaff && nightStaffCount >= minNightStaff) {
          staffShifts.set(dateStr, offPattern);
          generatedShifts.push({
            id: uuidv4(),
            tenantId,
            staffId: staff.id,
            date: dateStr,
            patternId: offPattern.id,
          });
        } else {
          // Assign a day shift
          const pattern = dayPatterns[Math.floor(Math.random() * dayPatterns.length)];
          staffShifts.set(dateStr, pattern);
          generatedShifts.push({
            id: uuidv4(),
            tenantId,
            staffId: staff.id,
            date: dateStr,
            patternId: pattern.id,
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

    // Save generated shifts to database using transaction
    await prisma.$transaction(async (tx) => {
      for (const shift of generatedShifts) {
        await tx.shift.upsert({
          where: {
            tenantId_staffId_date: {
              tenantId: shift.tenantId,
              staffId: shift.staffId,
              date: shift.date,
            },
          },
          create: {
            id: shift.id,
            tenantId: shift.tenantId,
            staffId: shift.staffId,
            date: shift.date,
            patternId: shift.patternId,
          },
          update: {
            patternId: shift.patternId,
          },
        });
      }
    });

    return {
      success: true,
      shiftsGenerated: generatedShifts.length,
      warnings,
      errors,
    };
  } catch (error) {
    console.error('Shift generation error:', error);
    errors.push(`シフト生成エラー: ${error}`);
    return { success: false, shiftsGenerated: 0, warnings, errors };
  }
}

// Clear shifts for a month (before regenerating)
export async function clearShifts(tenantId: string, month: string): Promise<number> {
  const result = await prisma.shift.deleteMany({
    where: {
      tenantId,
      date: { startsWith: month },
    },
  });
  return result.count;
}
