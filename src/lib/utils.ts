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
