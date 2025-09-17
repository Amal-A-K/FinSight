'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface MonthPickerProps {
  value: string; // yyyy-MM
  onChange: (newValue: string) => void;
  className?: string;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface PositionState {
  top: number;
  left: number;
  width: number;
  position: 'above' | 'below';
  positionType: 'fixed' | 'absolute';
  isMobile: boolean;
}

export function MonthPicker({ value, onChange, className = '' }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PositionState>({
    top: 0,
    left: 0,
    width: 0,
    position: 'below',
    positionType: 'absolute',
    isMobile: false,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const yearSelectRef = useRef<HTMLDivElement>(null);

  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [showYearSelect, setShowYearSelect] = useState(false);
  const [years, setYears] = useState<number[]>([]);

  // Parse the initial value
  const { year, monthIndex } = useMemo(() => {
    try {
      const [y, m] = value.split('-').map(Number);
      return {
        year: isNaN(y) ? new Date().getFullYear() : y,
        monthIndex: isNaN(m) ? new Date().getMonth() : m - 1,
      };
    } catch (error) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        monthIndex: now.getMonth(),
      };
    }
  }, [value]);

  // Generate years (current year - 10 to current year + 5)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 10; y <= currentYear + 5; y++) {
      years.push(y);
    }
    setYears(years);
    setViewYear(year);
  }, [year]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        (!yearSelectRef.current || !yearSelectRef.current.contains(event.target as Node))
      ) {
        setOpen(false);
        setShowYearSelect(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Update dropdown position when opened or window is resized
  const updatePosition = useRef(() => {
    if (!buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 768;

    const dropdownWidth = Math.min(320, viewportWidth - 32);
    const dropdownHeight = 320;

    // Calculate horizontal position (centered under button)
    let left = buttonRect.left + (buttonRect.width - dropdownWidth) / 2;
    left = Math.max(16, Math.min(left, viewportWidth - dropdownWidth - 16));

    // Calculate vertical position (prefer below, but above if not enough space)
    const spaceBelow = viewportHeight - buttonRect.bottom - 8;
    const spaceAbove = buttonRect.top - 8;

    let top: number;
    let position: 'above' | 'below' = 'below';

    if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
      // Position below
      top = buttonRect.bottom + 8;
    } else {
      // Position above
      position = 'above';
      top = buttonRect.top - dropdownHeight - 8;
    }

    // Ensure dropdown stays within viewport
    top = Math.max(8, Math.min(top, viewportHeight - dropdownHeight - 8));

    setPosition({
      top: isMobile ? top + window.scrollY : top,
      left: isMobile ? left : left + window.scrollX,
      width: dropdownWidth,
      position,
      positionType: isMobile ? 'fixed' : 'absolute',
      isMobile,
    });
  }).current;

  // Update position when dropdown is open or viewport changes
  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [open, updatePosition]);

  const handleMonthSelect = (monthIdx: number) => {
    const month = String(monthIdx + 1).padStart(2, '0');
    onChange(`${viewYear}-${month}`);
    setOpen(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newOpenState = !open;
    setOpen(newOpenState);

    if (newOpenState) {
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  };

  const displayLabel = useMemo(() => {
    if (monthIndex >= 0 && monthIndex < MONTH_FULL_LABELS.length) {
      return `${MONTH_FULL_LABELS[monthIndex]} ${year}`;
    }
    return 'Select month';
  }, [year, monthIndex]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className="flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-violet-200 bg-transparent px-3 py-1 text-sm text-violet-700 shadow-xs transition-all duration-200 outline-none hover:border-violet-400 focus-visible:border-violet-500 focus-visible:ring-violet-400/30 focus-visible:ring-[3px] dark:border-violet-800 dark:text-violet-200 dark:hover:border-violet-600"
      >
        <span className="truncate text-left">{displayLabel}</span>
        <Calendar className="h-5 w-5 flex-shrink-0 text-violet-600 dark:text-violet-300" />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999]"
          style={{ pointerEvents: 'none' }}
          onClick={() => setOpen(false)}
        >
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              className="fixed z-[10000] w-72 rounded-lg border border-violet-200 bg-white p-4 shadow-lg dark:border-violet-800 dark:bg-violet-950"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: position.width,
                position: position.positionType,
                pointerEvents: 'auto',
              }}
              initial={{ opacity: 0, y: position.position === 'below' ? -10 : 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: position.position === 'below' ? -10 : 10, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewYear((y) => y - 1);
                  }}
                  className="rounded-full p-1.5 text-violet-600 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-800"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowYearSelect(!showYearSelect);
                    }}
                    className="rounded-md px-3 py-1 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-800"
                  >
                    {viewYear}
                  </button>

                  {showYearSelect && (
                    <div
                      ref={yearSelectRef}
                      className="absolute left-1/2 z-10 mt-1 max-h-60 w-32 -translate-x-1/2 transform overflow-auto rounded-md border border-violet-200 bg-white py-1 shadow-lg dark:border-violet-700 dark:bg-violet-900"
                    >
                      {years.map((y) => (
                        <div
                          key={y}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewYear(y);
                            setShowYearSelect(false);
                          }}
                          className={`cursor-pointer px-4 py-1.5 text-center text-sm hover:bg-violet-100 dark:hover:bg-violet-800 ${
                            y === viewYear
                              ? 'bg-violet-100 font-medium text-violet-900 dark:bg-violet-800 dark:text-white'
                              : 'text-violet-700 dark:text-violet-200'
                          }`}
                        >
                          {y}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewYear((y) => y + 1);
                  }}
                  className="rounded-full p-1.5 text-violet-600 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-800"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MONTH_LABELS.map((month, idx) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleMonthSelect(idx)}
                    className={`flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      monthIndex === idx && year === viewYear
                        ? 'bg-violet-600 text-white'
                        : 'hover:bg-violet-100 dark:hover:bg-violet-800'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  );
}


