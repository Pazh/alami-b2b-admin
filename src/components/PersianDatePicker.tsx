import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import { getCurrentPersianDate } from '../utils/dateUtils';

interface PersianDatePickerProps {
  value: string; // 8-digit format: YYYYMMDD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dateString: string;
}

// Persian month names
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Persian day names
const PERSIAN_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

// Persian day abbreviations
const PERSIAN_DAY_ABBR = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentYear, setCurrentYear] = useState(1403);
  const [currentMonth, setCurrentMonth] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize display value and calendar
  useEffect(() => {
    if (value && value.length === 8) {
      setDisplayValue(formatPersianDateForDisplay(value));
      setCurrentYear(parseInt(value.substring(0, 4)));
      setCurrentMonth(parseInt(value.substring(4, 6)));
    } else {
      setDisplayValue('');
      // Set to current Persian date
      const today = getCurrentPersianDate();
      setCurrentYear(parseInt(today.substring(0, 4)));
      setCurrentMonth(parseInt(today.substring(4, 6)));
    }
  }, [value]);

  // Set default value to today when component mounts
  // useEffect(() => {
  //   if (!value || value.length !== 8) {
  //     const today = getCurrentPersianDate();
  //     onChange(today);
  //   }
  // }, []); // Empty dependency array means this runs only once when component mounts

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Try to parse the input
    if (inputValue.includes('/')) {
      const parts = inputValue.split('/');
      if (parts.length === 3) {
        const year = parts[0].padStart(4, '0');
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const dateString = `${year}${month}${day}`;
        
        if (validatePersianDate(dateString)) {
          onChange(dateString);
        }
      }
    }
  };

  const handleDateSelect = (calendarDay: CalendarDay) => {
    onChange(calendarDay.dateString);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };



  // Format Persian date for display
  const formatPersianDateForDisplay = (dateString: string): string => {
    if (!dateString || dateString.length !== 8) return dateString;
    
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    
    return `${year}/${month}/${day}`;
  };

  // Validate Persian date
  const validatePersianDate = (dateString: string): boolean => {
    if (!dateString || dateString.length !== 8) return false;
    
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6));
    const day = parseInt(dateString.substring(6, 8));
    
    // Basic validation
    if (year < 1300 || year > 1500) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    // Month-specific validation
    if (month <= 6 && day > 31) return false;
    if (month > 6 && month <= 11 && day > 30) return false;
    if (month === 12 && day > 29) return false;
    
    return true;
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return 29; // Simplified - doesn't account for leap years
  };

  // Calculate Persian calendar day of week
  const getPersianDayOfWeek = (year: number, month: number, day: number): number => {
    // Convert Persian date to Gregorian for calculation
    let gregorianYear = year + 621;
    let gregorianMonth = month;
    let gregorianDay = day;
    
    // Adjust for Persian calendar differences
    if (month <= 9) {
      gregorianMonth = month + 3;
    } else {
      gregorianMonth = month - 9;
      gregorianYear++;
    }
    
    // Create Date object and get day of week
    const date = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
    const dayOfWeek = date.getDay();
    
    // Convert to Persian day of week (0 = Saturday, 1 = Sunday, etc.)
    return (dayOfWeek + 6) % 7;
  };

  // Get calendar days with proper weekday alignment
  const getCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    
    // Get the first day of the current month
    const firstDayWeekday = getPersianDayOfWeek(currentYear, currentMonth, 1);
    
    // Get the last day of the current month
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    // Get the last day of the previous month
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    // Add days from previous month to fill the first week
    for (let i = 0; i < firstDayWeekday; i++) {
      const day = daysInPrevMonth - (firstDayWeekday - 1 - i);
      const dateString = `${prevYear}${prevMonth.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
      
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        dateString
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}${currentMonth.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
      const isToday = isTodayDate(dateString);
      const isSelected = value === dateString;
      
      days.push({
        day,
        isCurrentMonth: true,
        isToday,
        isSelected,
        dateString
      });
    }
    
    // Add days from next month to complete the grid (6 rows * 7 columns = 42 total)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const dateString = `${nextYear}${nextMonth.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
      
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        dateString
      });
    }
    
    return days;
  };

  // Check if a date is today
  const isTodayDate = (dateString: string): boolean => {
    const today = getCurrentPersianDate();
    return dateString === today;
  };

  const renderCalendar = () => {
    const calendarDays = getCalendarDays();
    
    return calendarDays.map((calendarDay, index) => (
      <button
        key={index}
        onClick={() => handleDateSelect(calendarDay)}
        className={`w-8 h-8 text-sm rounded-md transition-colors ${
          calendarDay.isSelected
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : calendarDay.isToday
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : calendarDay.isCurrentMonth
            ? 'text-gray-700 hover:bg-blue-100 hover:text-blue-600'
            : 'text-gray-400 hover:bg-gray-100'
        }`}
      >
        {toPersianDigits(calendarDay.day)}
      </button>
    ));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className} ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
          }`}
          readOnly
        />
        <Calendar 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" 
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {PERSIAN_MONTHS[currentMonth - 1]} {toPersianDigits(currentYear)}
              </div>
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {PERSIAN_DAY_ABBR.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          {/* Selected date info */}
          {value && value.length === 8 && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <div className="text-sm text-gray-600">
                {formatPersianDateForDisplay(value)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {PERSIAN_DAYS[getPersianDayOfWeek(
                  parseInt(value.substring(0, 4)),
                  parseInt(value.substring(4, 6)),
                  parseInt(value.substring(6, 8))
                )]}
              </div>
            </div>
          )}

          {/* Today button */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => {
                const today = getCurrentPersianDate();
                onChange(today);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              امروز
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersianDatePicker; 