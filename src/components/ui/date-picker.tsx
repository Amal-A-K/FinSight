'use client';

import { format, addMonths, subMonths, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

type DropdownPosition = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  transform?: string;
  width?: string;
  position?: string;
  zIndex?: string | number;
};

type DatePickerProps = {
  value: string;
  onChange: (date: string) => void;
  className?: string;
};

export function DatePicker({ value, onChange, className = '' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(value || new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [position, setPosition] = useState<DropdownPosition>({ 
    top: '100%',
    left: '0',
    transform: 'none'
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(date);
      }
    }
  }, [value]);

  // Position dropdown centered above the input
  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dropdownWidth = 288; // 18rem = 288px
    const dropdownHeight = 320; // Approximate height of the dropdown
    
    // Calculate horizontal center position
    let left = buttonRect.left + (buttonRect.width - dropdownWidth) / 2;
    
    // Adjust if dropdown would go off the right edge
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 8; // 8px margin from edge
    }
    
    // Adjust if dropdown would go off the left edge
    if (left < 8) {
      left = 8; // 8px margin from edge
    }
    
    // Position above the input with a small gap
    let top = buttonRect.top - dropdownHeight - 4;
    
    // If there's not enough space above, position below with a gap
    if (top < 8) {
      top = buttonRect.bottom + 4;
    }
    
    // Ensure we don't go below the viewport
    if (top + dropdownHeight > viewportHeight) {
      top = viewportHeight - dropdownHeight - 8;
    }
    
    setPosition({
      position: 'fixed',
      top: `${Math.max(8, top)}px`,
      left: `${left}px`,
      width: `${dropdownWidth}px`,
      zIndex: 9999,
      transform: 'none'
    });
  }, []);

  const toggleDropdown = useCallback(() => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  }, [isOpen, updateDropdownPosition]);

  // Handle dropdown positioning and outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener('resize', updateDropdownPosition);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, updateDropdownPosition]);

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    // Format as yyyy-MM-dd for the onChange value (ISO format for data)
    onChange(format(newDate, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
    // Format as yyyy-MM-dd for the onChange value (ISO format for data)
    onChange(format(today, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];
    const daysCount = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Add day cells
    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const isToday = isSameDay(date, new Date());

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors
            ${isSelected 
              ? 'bg-violet-600 text-white' 
              : isToday 
                ? 'border border-violet-400 dark:border-violet-500' 
                : 'hover:bg-violet-100 dark:hover:bg-violet-900'}
            ${!isSameMonth(date, currentMonth) ? 'opacity-30' : ''}`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`relative z-10 w-full ${className}`} ref={containerRef}>
      <div className="relative w-full">
        <button
          type="button"
          onClick={toggleDropdown}
          ref={buttonRef}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-all duration-200 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-left",
            "border-violet-200 dark:border-violet-800",
            "text-violet-700 dark:text-violet-100",
            !selectedDate && "text-violet-500/80 dark:text-violet-400/80",
            "hover:border-violet-400 dark:hover:border-violet-600",
            "focus-visible:border-violet-500 focus-visible:ring-violet-400/30 focus-visible:ring-[3px] focus-visible:ring-offset-1",
            "dark:bg-violet-950/30"
          )}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span>{selectedDate ? format(selectedDate, 'dd-MM-yyyy') : 'Select a date'}</span>
          <CalendarIcon className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
        </button>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed w-72 rounded-lg border bg-white p-4 shadow-lg dark:border-violet-800 dark:bg-violet-950"
          style={{
            top: position.top,
            left: '50%',
            transform: 'translateX(-50%)',
            maxHeight: 'calc(100vh - 2rem)',
            overflowY: 'auto',
            zIndex: 9999,
            width: '288px',
            position: 'fixed' as const
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Calendar"
        >
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={prevMonth}
              className="p-1 rounded-full hover:bg-violet-100 dark:hover:bg-violet-800 text-violet-700 dark:text-violet-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="font-medium text-violet-900 dark:text-violet-100">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button 
              onClick={nextMonth}
              className="p-1 rounded-full hover:bg-violet-100 dark:hover:bg-violet-800 text-violet-700 dark:text-violet-300"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-violet-500 dark:text-violet-400">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="h-6 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderDays()}
          </div>

          {/* Today button */}
          <div className="mt-4 pt-3 border-t border-violet-100 dark:border-violet-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              className="w-full text-violet-700 dark:text-violet-200 border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900"
            >
              Today
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
