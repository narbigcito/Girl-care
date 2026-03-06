const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

/**
 * Parse a "YYYY-MM-DD" string to a UTC midnight Date object.
 * Avoids DST issues by always using UTC.
 */
function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00Z');
}

/**
 * Number of days from dateStrA to dateStrB (positive if B is after A).
 */
export function daysBetween(dateStrA, dateStrB) {
  const a = parseDate(dateStrA);
  const b = parseDate(dateStrB);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Return a new "YYYY-MM-DD" string that is n days after dateStr.
 */
export function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Format a "YYYY-MM-DD" string for display.
 * format: "short" → "14 feb", "long" → "14 de febrero de 2026"
 */
export function formatDate(dateStr, format = 'short') {
  const d = parseDate(dateStr);
  if (format === 'long') {
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * Today's date as "YYYY-MM-DD" string.
 */
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Derive CycleRecord[] from the dayEntries flat map.
 * A cycle starts when we find a period day that is not within 1 day
 * of the previous period day.
 * Returns sorted by startDate ascending.
 */
export function syncCyclesToEntries(dayEntries) {
  const periodDays = Object.values(dayEntries)
    .filter((e) => e.periodStatus !== null && e.periodStatus !== undefined)
    .map((e) => e.date)
    .sort();

  if (periodDays.length === 0) return [];

  const cycles = [];
  let currentStart = periodDays[0];
  let currentEnd = periodDays[0];

  for (let i = 1; i < periodDays.length; i++) {
    const gap = daysBetween(currentEnd, periodDays[i]);
    if (gap <= 1) {
      currentEnd = periodDays[i];
    } else {
      cycles.push({ startDate: currentStart, endDate: currentEnd });
      currentStart = periodDays[i];
      currentEnd = periodDays[i];
    }
  }
  cycles.push({ startDate: currentStart, endDate: currentEnd });

  return cycles;
}

/**
 * Average cycle length in days from a list of CycleRecords.
 * Needs at least 2 cycles to compute; otherwise returns default.
 */
export function calculateAverageCycleLength(cycles) {
  if (cycles.length < 2) return DEFAULT_CYCLE_LENGTH;
  const lengths = [];
  for (let i = 1; i < cycles.length; i++) {
    lengths.push(daysBetween(cycles[i - 1].startDate, cycles[i].startDate));
  }
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

/**
 * Average period length in days from a list of CycleRecords.
 * Falls back to default when no data.
 */
export function calculateAveragePeriodLength(cycles) {
  if (cycles.length === 0) return DEFAULT_PERIOD_LENGTH;
  const lengths = cycles.map(
    (c) => daysBetween(c.startDate, c.endDate) + 1
  );
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

/**
 * Predict next period window based on cycle history.
 * Returns { start, end } as "YYYY-MM-DD" strings, or null if no data.
 */
export function predictNextPeriod(cycles, avgCycleLength, avgPeriodLength) {
  if (cycles.length === 0) return null;

  const lastStart = cycles[cycles.length - 1].startDate;
  const predictedStart = addDays(lastStart, avgCycleLength);
  const predictedEnd = addDays(predictedStart, avgPeriodLength - 1);

  return { start: predictedStart, end: predictedEnd };
}

/**
 * Determine which cycle phase a given date falls in.
 * Returns "menstrual" | "follicular" | "ovulation" | "luteal" | "late" | null
 */
export function getPhaseForDate(date, cycles, avgCycleLength, avgPeriodLength) {
  if (cycles.length === 0) return null;

  // Find the most recent cycle start on or before this date
  const relevant = cycles
    .filter((c) => c.startDate <= date)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

  if (relevant.length === 0) return null;

  const cycleStart = relevant[0].startDate;
  const dayOfCycle = daysBetween(cycleStart, date) + 1;

  if (dayOfCycle <= avgPeriodLength) return 'menstrual';
  if (dayOfCycle <= 12) return 'follicular';
  if (dayOfCycle <= 16) return 'ovulation';
  if (dayOfCycle <= avgCycleLength) return 'luteal';
  return 'late';
}

/**
 * Check whether a date falls inside the predicted period window.
 */
export function isInPredictedWindow(date, prediction) {
  if (!prediction) return false;
  return date >= prediction.start && date <= prediction.end;
}
