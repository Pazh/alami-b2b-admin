import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { PERSIAN_MONTHS, formatPersianDateForDisplay, validatePersianDate } from '../utils/dateUtils';
import { toPersianDigits } from '../utils/numberUtils';

interface PersianDatePickerProps {
  value: string; // 8-digit format: YYYYMMDD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

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
    }
  }, [value]);

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

  const handleDateSelect = (day: number) => {
    const dateString = `${currentYear}${currentMonth.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
    onChange(dateString);
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

  const getDaysInMonth = (year: number, month: number): number => {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return 29; // Simplified - doesn't account for leap years
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}${currentMonth.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
      const isSelected = value === dateString;
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`w-8 h-8 text-sm rounded-md hover:bg-blue-100 transition-colors ${
            isSelected 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'text-gray-700 hover:text-blue-600'
          }`}
        >
          {toPersianDigits(day)}
        </button>
      );
    }

    return days;
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
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          {/* Today button */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => {
                const today = new Date();
                const persianYear = today.getFullYear() - 621;
                const persianMonth = today.getMonth() + 1;
                const persianDay = today.getDate();
                
                const todayString = `${persianYear}${persianMonth.toString().padStart(2, '0')}${persianDay.toString().padStart(2, '0')}`;
                onChange(todayString);
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