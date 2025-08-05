// Utility functions for Persian date handling

export const getCurrentPersianDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // Convert to Persian date (approximate conversion)
  // This is a simplified conversion - for production use a proper library
  const persianYear = year - 621;
  const persianMonth = month;
  const persianDay = day;
  
  return `${persianYear}${persianMonth.toString().padStart(2, '0')}${persianDay.toString().padStart(2, '0')}`;
};

export const formatPersianDateForDisplay = (dateString: string): string => {
  if (!dateString || dateString.length !== 8) return dateString;
  
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  
  return `${year}/${month}/${day}`;
};

export const parsePersianDateFromDisplay = (displayDate: string): string => {
  if (!displayDate) return '';
  
  const parts = displayDate.split('/');
  if (parts.length !== 3) return displayDate;
  
  const year = parts[0].padStart(4, '0');
  const month = parts[1].padStart(2, '0');
  const day = parts[2].padStart(2, '0');
  
  return `${year}${month}${day}`;
};

export const validatePersianDate = (dateString: string): boolean => {
  if (!dateString || dateString.length !== 8) return false;
  
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6));
  const day = parseInt(dateString.substring(6, 8));
  
  // Basic validation
  if (year < 1300 || year > 1500) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // More specific month validation
  if (month <= 6 && day > 31) return false;
  if (month > 6 && month <= 11 && day > 30) return false;
  if (month === 12 && day > 29) return false;
  
  return true;
};

// Persian month names
export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Get current Persian date in proper format
export const getTodayPersianDate = (): string => {
  const now = new Date();
  
  // Simple conversion (for demo purposes)
  // In production, use a proper Persian calendar library
  const gregorianYear = now.getFullYear();
  const gregorianMonth = now.getMonth() + 1;
  const gregorianDay = now.getDate();
  
  // Approximate conversion to Persian calendar
  let persianYear = gregorianYear - 621;
  let persianMonth = gregorianMonth;
  let persianDay = gregorianDay;
  
  // Adjust for Persian calendar differences (simplified)
  if (gregorianMonth <= 3) {
    persianYear--;
    persianMonth += 9;
  } else {
    persianMonth -= 3;
  }
  
  // Ensure we don't go beyond valid ranges
  if (persianMonth > 12) {
    persianMonth = 12;
  }
  if (persianDay > 29 && persianMonth === 12) {
    persianDay = 29;
  }
  
  return `${persianYear}${persianMonth.toString().padStart(2, '0')}${persianDay.toString().padStart(2, '0')}`;
};

// Convert JavaScript Date to Persian date string
export const toPersianDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Simple conversion to Persian calendar (approximate)
  let persianYear = year - 621;
  let persianMonth = month;
  let persianDay = day;
  
  // Adjust for Persian calendar differences (simplified)
  if (month <= 3) {
    persianYear--;
    persianMonth += 9;
  } else {
    persianMonth -= 3;
  }
  
  // Ensure we don't go beyond valid ranges
  if (persianMonth > 12) {
    persianMonth = 12;
  }
  if (persianDay > 29 && persianMonth === 12) {
    persianDay = 29;
  }
  
  return `${persianYear}/${persianMonth.toString().padStart(2, '0')}/${persianDay.toString().padStart(2, '0')}`;
};