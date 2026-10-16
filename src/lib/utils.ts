import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a date string from various formats to YYYY-MM-DD (ISO format)
 * which is required by HTML <input type="date">.
 * 
 * Handles:
 * - DD-MM-YYYY, D-M-YYYY (Indian/bio data format from Excel/SQL)
 * - DD/MM/YYYY, D/M/YYYY
 * - YYYY-MM-DD (already correct, returned as-is)
 * - Excel serial numbers (e.g. 44562)
 * - Empty/null/undefined → returns ''
 */
export function normalizeDate(raw: any): string {
  if (raw === null || raw === undefined || raw === '') return '';
  
  const str = String(raw).trim();
  if (!str || str === 'N/A' || str === 'null' || str === 'undefined') return '';

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // DD-MM-YYYY or D-M-YYYY format (most common from bio data Excel)
  const dashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, d, m, y] = dashMatch.map(Number);
    if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // DD/MM/YYYY or D/M/YYYY format
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch.map(Number);
    if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Excel serial number (numeric date)
  const numVal = Number(str);
  if (!isNaN(numVal) && numVal > 30000 && numVal < 60000) {
    // Excel epoch is 1899-12-30
    const excelEpoch = new Date(1899, 11, 30);
    const dateObj = new Date(excelEpoch.getTime() + numVal * 86400000);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  }

  return '';
}

/**
 * Calculates age in completed years from a date of birth.
 * Accepts any format that normalizeDate() can handle.
 * Returns 0 for empty, invalid or future dates.
 */
export function calculateAge(rawDob: any): number {
  const iso = normalizeDate(rawDob);
  if (!iso) return 0;

  const [y, m, d] = iso.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age--;
  }
  return age > 0 ? age : 0;
}

export type Meridiem = 'AM' | 'PM' | '';

/**
 * Splits a stored time like "09:30 AM" into its clock part and AM/PM part.
 */
export function splitTime(raw: any): { time: string; period: Meridiem } {
  const str = String(raw ?? '').trim();
  const match = str.match(/^(.*?)\s*(am|pm)$/i);
  if (match) {
    return { time: match[1].trim(), period: match[2].toUpperCase() as Meridiem };
  }
  return { time: str, period: '' };
}

/**
 * Cleans up a typed clock value to hh:mm (12-hour).
 * 24-hour input like "21:00" is converted to "09:00" with period "PM".
 */
export function normalizeClock(time: string, period: Meridiem): { time: string; period: Meridiem } {
  const match = time.trim().match(/^(\d{1,2})(?:[:.](\d{1,2}))?$/);
  if (!match) return { time, period };

  let h = Number(match[1]);
  const m = Number(match[2] || 0);
  if (h > 23 || m > 59) return { time, period };

  if (h === 0) {
    h = 12;
    period = 'AM';
  } else if (h > 12) {
    h -= 12;
    period = 'PM';
  }
  return { time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, period };
}

/**
 * Converts a stored time ("09:30 AM", or 24-hour "21:00") to minutes since midnight.
 * Returns null when the time or its AM/PM is missing.
 */
function timeToMinutes(raw: any): number | null {
  const { time, period } = splitTime(raw);
  const match = time.match(/^(\d{1,2})(?:[:.](\d{1,2}))?$/);
  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2] || 0);
  if (h > 23 || m > 59) return null;

  if (!period) {
    // Without AM/PM only unambiguous 24-hour values can be used
    return h > 12 || h === 0 ? h * 60 + m : null;
  }
  if (h < 1 || h > 12) return null;
  return ((h % 12) + (period === 'PM' ? 12 : 0)) * 60 + m;
}

/**
 * Duty hours between an in-time and out-time, e.g. "09:00 AM" → "05:30 PM" = "8.5".
 * Out-time earlier than in-time is treated as the next day (night shift).
 * Returns '' when either time is incomplete.
 */
export function calculateDutyHours(inTime: any, outTime: any): string {
  const start = timeToMinutes(inTime);
  const end = timeToMinutes(outTime);
  if (start === null || end === null) return '';

  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  return String(Math.round((diff / 60) * 100) / 100);
}

/**
 * Splits a total break time into two equal breaks, e.g. "30 mins" → "15 mins".
 * Understands "30", "30 mins", "1 hr", "1 hr 30 min". Returns '' if unreadable.
 */
export function halfBreakTime(raw: any): string {
  const str = String(raw ?? '').toLowerCase().trim();
  if (!str) return '';

  const hrMatch = str.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = str.match(/(\d+(?:\.\d+)?)\s*m/);
  let totalMinutes: number;

  if (hrMatch || minMatch) {
    totalMinutes = (hrMatch ? Number(hrMatch[1]) * 60 : 0) + (minMatch ? Number(minMatch[1]) : 0);
  } else {
    const num = str.match(/^(\d+(?:\.\d+)?)$/);
    if (!num) return '';
    totalMinutes = Number(num[1]);
  }

  if (!totalMinutes) return '';
  const half = Math.round((totalMinutes / 2) * 10) / 10;
  return `${half} mins`;
}

/**
 * Formats a date string for human-readable display (DD-MM-YYYY).
 * Accepts any format that normalizeDate() can handle.
 * Returns original string if it can't be parsed.
 */
export function formatDateDisplay(raw: any): string {
  if (!raw || raw === 'N/A') return 'N/A';

  const iso = normalizeDate(raw);
  if (!iso) {
    // If normalize failed but we have a raw string, return it as-is
    return String(raw).trim() || 'N/A';
  }

  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}
