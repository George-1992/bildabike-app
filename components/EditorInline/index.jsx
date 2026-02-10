'use client';

import { cn } from "@/libs/utils";
import { toNumLocalString } from "@/utils/other";
import { Save, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";


export default function EditorInline({
    className = '',
    children = null,
    data = null,
    field = '',
    type = 'text',
    formatType = 'text', // text, number, currency, date, datetime, email, phone, textarea
    value = '',
    onChange = () => { },
    onSave = () => { },
    onCancel = () => { },
    isEditing = false,
    setIsEditing = () => { },
}) {

    const [_isEditing, _setIsEditing] = useState(isEditing);
    const [inputValue, setInputValue] = useState(value || '');
    const inputRef = useRef(null);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        if (_isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [_isEditing]);

    const handleClick = () => {
        if (!_isEditing) {
            _setIsEditing(true);
            setIsEditing(true);
        }
    };

    const handleSave = () => {
        onSave(inputValue, field, data);
        onChange(inputValue);
        _setIsEditing(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setInputValue(value || '');
        onCancel();
        _setIsEditing(false);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        onChange(e.target.value);
    };



    const getDisplayValue = () => {
        let v = inputValue;
        if (type === 'number') {
            v = toNumLocalString(inputValue);
        } else {
            // return inputValue;
        }


        // foramtType
        if (formatType === 'currency') {
            v = `$${toNumLocalString(inputValue)}`;
        }

        return v;
    }

    if (_isEditing) {
        return (
            <div
                className={cn(
                    className && className,
                    'max-w-full',
                    `editor-inline editing`,
                    'bg-yellow-200 p-1 rounded'
                )}
            >
                <div className="flex items-center gap-2 relative">
                    {type === 'textarea' ? (
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="focus:ring-0 outline:ring-0 focus:outline-none"
                            rows={3}
                        />
                    ) : (
                        <input
                            ref={inputRef}
                            type={type}
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="focus:ring-0 outline:ring-0 focus:outline-none"
                        />
                    )}
                    <div className="absolute top-full p-1 rounded-b left-0 bg-yellow-200">
                        <button
                            onClick={handleSave}
                            className="bg-green-400 mr-1 hover:bg-green-500 text-white px-2 py-1 rounded text-xs"
                            title="Save (Enter)"
                        >
                            <Save className="size-3" />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-red-400 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
                            title="Cancel (Esc)"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }




    return (
        <div
            className={`editor-inline cursor-pointer rounded hover:bg-gray-100 transition-colors duration-200 ${className}`}
            onClick={handleClick}
        >
            {value ? getDisplayValue() : children || 'n/a'}
        </div>
    );
}