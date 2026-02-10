'use client';

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

export const Toggle = ({ label, checked, onChange, disabled, className = '' }) => {
    const [isChecked, setIsChecked] = useState(checked || false);

    useEffect(() => {
        if (checked !== undefined) {
            setIsChecked(checked);
        }
    }, [checked]);

    const handleCheckboxChange = () => {
        if (disabled) return;
        
        const newChecked = !isChecked;
        setIsChecked(newChecked);
        if (onChange) {
            onChange(newChecked);
        }
    };

    return (
        <label 
            className={`flex cursor-pointer select-none items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
        >
            <div className='relative'>
                <input
                    disabled={disabled}
                    type='checkbox'
                    checked={isChecked || false}
                    onChange={handleCheckboxChange}
                    className='sr-only'
                />
                <div 
                    className={`block h-6 w-12 rounded-full border-2 transition-colors duration-200 ease-in-out ${
                        isChecked 
                            ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                            : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                    }`}
                ></div>
                <div
                    className={`dot absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${
                        isChecked ? 'translate-x-6' : 'translate-x-0'
                    }`}
                >
                    <span className={`transition-opacity duration-150 ${isChecked ? 'opacity-100' : 'opacity-0'}`}>
                        <Check className='h-2.5 w-2.5 text-blue-600' />
                    </span>
                    <span className={`absolute transition-opacity duration-150 ${!isChecked ? 'opacity-100' : 'opacity-0'}`}>
                        <X className='h-2.5 w-2.5 text-gray-400' />
                    </span>
                </div>
            </div>
            {label && (
                <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {label}
                </span>
            )}
        </label>
    );
};