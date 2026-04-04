
"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * DatePicker component updated to use the native browser/mobile date picker.
 * This ensures the best UX on mobile devices and immediate closing after selection.
 */
export function DatePicker({
  date,
  onDateChange,
  className,
  placeholder
}: {
  date: Date | undefined,
  onDateChange: (date: Date | undefined) => void,
  className?: string,
  placeholder?: string
}) {
  // Convert Date object to YYYY-MM-DD string for native input value
  // We use local date components to avoid timezone shifts during conversion
  const dateValue = React.useMemo(() => {
    if (!date) return "";
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return "";
    }
  }, [date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      onDateChange(undefined);
      return;
    }
    
    // Parse the YYYY-MM-DD string correctly as a local date to avoid timezone issues
    const [year, month, day] = value.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    onDateChange(localDate);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      <Input
        type="date"
        value={dateValue}
        onChange={handleChange}
        title={placeholder}
        className={cn(
          "pl-10 w-full bg-background cursor-pointer block h-10",
          !date && "text-muted-foreground",
          // Ensure the native picker trigger icon is also a pointer
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer"
        )}
      />
    </div>
  )
}
