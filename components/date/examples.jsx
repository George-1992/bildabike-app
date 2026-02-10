'use client';

import { useState } from 'react';
import DateInput from './index';

// Example usage of the DateInput component with react-datepicker

export const DateExamples = () => {
    const [basicDate, setBasicDate] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [constrainedDate, setConstrainedDate] = useState('');

    const today = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return (
        <div className="space-y-6 p-6">
            {/* Basic Date Input */}
            <div>
                <label className="block text-sm font-medium mb-2">Basic Date Input</label>
                <DateInput
                    value={basicDate}
                    onChange={(e) => setBasicDate(e.target.value)}
                    placeholder="Select a date..."
                    name="basicDate"
                />
                <p className="text-sm text-gray-500 mt-1">Value (ISO 8601): {basicDate}</p>
                <p className="text-xs text-gray-400 mt-1">Format: YYYY-MM-DD</p>
            </div>

            {/* Date with Time */}
            <div>
                <label className="block text-sm font-medium mb-2">Date with Time</label>
                <DateInput
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    placeholder="Select date and time..."
                    showTime={true}
                    name="dateTime"
                />
                <p className="text-sm text-gray-500 mt-1">Value (ISO 8601): {dateTime}</p>
                <p className="text-xs text-gray-400 mt-1">Format: YYYY-MM-DDTHH:mm:ss.sssZ</p>
            </div>

            {/* Date with Constraints */}
            <div>
                <label className="block text-sm font-medium mb-2">Date with Min/Max (Today to Next Week)</label>
                <DateInput
                    value={constrainedDate}
                    onChange={(e) => setConstrainedDate(e.target.value)}
                    placeholder="Select within range..."
                    minDate={today}
                    maxDate={nextWeek}
                    name="constrainedDate"
                />
                <p className="text-sm text-gray-500 mt-1">Selected: {constrainedDate}</p>
            </div>

            {/* Disabled Date Input */}
            <div>
                <label className="block text-sm font-medium mb-2">Disabled Date Input</label>
                <DateInput
                    value="2024-12-25"
                    onChange={() => {}}
                    placeholder="This is disabled"
                    disabled={true}
                    name="disabledDate"
                />
            </div>

            {/* Error State */}
            <div>
                <label className="block text-sm font-medium mb-2">Error State</label>
                <DateInput
                    value=""
                    onChange={(e) => setBasicDate(e.target.value)}
                    placeholder="This has an error..."
                    error="This field is required"
                    required={true}
                    name="errorDate"
                />
            </div>

            {/* Non-clearable */}
            <div>
                <label className="block text-sm font-medium mb-2">Non-clearable Date</label>
                <DateInput
                    value="2024-10-08"
                    onChange={(e) => setBasicDate(e.target.value)}
                    placeholder="Cannot be cleared"
                    clearable={false}
                    name="nonClearableDate"
                />
            </div>

            {/* Custom Date Format */}
            <div>
                <label className="block text-sm font-medium mb-2">Custom Format (MM/dd/yyyy)</label>
                <DateInput
                    value={basicDate}
                    onChange={(e) => setBasicDate(e.target.value)}
                    placeholder="MM/dd/yyyy"
                    dateFormat="MM/dd/yyyy"
                    name="customFormat"
                />
                <p className="text-sm text-gray-500 mt-1">Selected: {basicDate}</p>
            </div>
        </div>
    );
};

export default DateExamples;