// Utility functions for number formatting and conversion

export const toPersianDigits = (num: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

export const toEnglishDigits = (str: string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let result = str;
  
  // Convert Persian digits
  persianDigits.forEach((persian, index) => {
    result = result.replace(new RegExp(persian, 'g'), englishDigits[index]);
  });
  
  // Convert Arabic digits (in case user types Arabic numbers)
  arabicDigits.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, 'g'), englishDigits[index]);
  });
  
  return result;
};

export const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('fa-IR').format(amount);
  return toPersianDigits(formatted);
};

export const formatNumber = (num: number): string => {
  return toPersianDigits(num.toString());
};

export const parsePersianNumber = (str: string): number => {
  const englishStr = toEnglishDigits(str);
  return parseInt(englishStr) || 0;
};

export const formatPersianNumber = (num: number): string => {
  return toPersianDigits(num.toString());
};