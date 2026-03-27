'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

export const Toggle = ({ label, checked, onChange, disabled, className = '' }) => {
 
    const [isChecked, setIsChecked] = useState(checked || false);

    const trackRef = useRef(null);
    const dotRef = useRef(null);
    const checkRef = useRef(null);
    const crossRef = useRef(null);

    useEffect(() => {
        if (checked !== undefined) {
            setIsChecked(checked);
        }
    }, [checked]);

    useEffect(() => {
        if (trackRef.current) {
            trackRef.current.classList.toggle('bg-blue-600', isChecked);
            trackRef.current.classList.toggle('border-blue-600', isChecked);
            trackRef.current.classList.toggle('dark:bg-blue-500', isChecked);
            trackRef.current.classList.toggle('dark:border-blue-500', isChecked);
            trackRef.current.classList.toggle('bg-gray-200', !isChecked);
            trackRef.current.classList.toggle('border-gray-300', !isChecked);
            trackRef.current.classList.toggle('dark:bg-gray-700', !isChecked);
            trackRef.current.classList.toggle('dark:border-gray-600', !isChecked);
        }
        if (dotRef.current) {
            dotRef.current.classList.toggle('translate-x-6', isChecked);
            dotRef.current.classList.toggle('translate-x-0', !isChecked);
        }
        if (checkRef.current) {
            checkRef.current.classList.toggle('opacity-100', isChecked);
            checkRef.current.classList.toggle('opacity-0', !isChecked);
        }
        if (crossRef.current) {
            crossRef.current.classList.toggle('opacity-100', !isChecked);
            crossRef.current.classList.toggle('opacity-0', isChecked);
        }
    }, [isChecked]);

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
                    ref={trackRef}
                    className='block h-6 w-12 rounded-full border-2 transition-colors duration-200 ease-in-out bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                ></div>
                <div
                    ref={dotRef}
                    className='dot absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm translate-x-0'
                >
                    <span ref={checkRef} className='transition-opacity duration-150 opacity-0'>
                        <Check className='h-2.5 w-2.5 text-blue-600' />
                    </span>
                    <span ref={crossRef} className='absolute transition-opacity duration-150 opacity-100'>
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