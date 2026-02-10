'use client';

import { Calendar } from 'lucide-react';

/**
 * DateDisplay Component
 * Displays a date with calendar icon, month name, and day
 * 
 * @param {string|Date} date - Date to display (ISO string, Date object, or any parseable date)
 * @param {string} className - Additional CSS classes
 * @param {boolean} showYear - Whether to show the year (default: false)
 * @param {string} format - Format type: 'short' (Jan 15) or 'long' (January 15) (default: 'short')
 * @param {number} iconSize - Size of the calendar icon in pixels (default: 16)
 */
export const DateDisplay = ({ 
    date, 
    className = '', 
    showYear = false, 
    format = 'short',
    iconSize = 16 
}) => {
    if (!date) {
        return (
            <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
                <Calendar size={iconSize} />
                <span className="text-sm">No date</span>
            </div>
        );
    }

    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return (
            <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
                <Calendar size={iconSize} />
                <span className="text-sm">Invalid date</span>
            </div>
        );
    }

    const monthNames = {
        short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        long: ['January', 'February', 'March', 'April', 'May', 'June',
               'July', 'August', 'September', 'October', 'November', 'December']
    };

    const month = monthNames[format][dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Calendar size={iconSize} className="text-gray-500" />
            <span className="text-sm font-medium">
                {month} {day}
                {showYear && `, ${year}`}
            </span>
        </div>
    );
};

export default DateDisplay;