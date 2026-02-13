'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export const Select = ({
    value = '',
    onChange = () => { },
    options = [], // Array of strings ['option1', 'option2'] or objects [{ value: 'val1', label: 'Label 1', disabled: false }]
    placeholder = 'Select an option...',
    searchable = false,
    clearable = false,
    disabled = false,
    required = false,
    error = '',
    className = '',
    dropdownClassName = '',
    multiple = false,
    maxHeight = '200px',
    renderOption = null, // Custom render function for options
    renderValue = null,  // Custom render function for selected value
    loading = false,
    loadingText = 'Loading...',
    noOptionsText = 'No options found',
    name = '',
    id = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const selectRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // console.log('options: ', options);


    // Normalize options to consistent format
    const normalizedOptions = options.map((option, index) => {
        // Handle string options
        if (typeof option === 'string') {
            return {
                value: option?.value || option?.name || option?.id || option,
                label: option,
                disabled: false
            };
        }

        // Handle object options
        if (typeof option === 'object' && option !== null) {
            // Ensure we have both value and label
            const optionValue = option.value !== undefined ? option.value : (option.id || option.label || index);
            const optionLabel = option.label !== undefined ? option.label : (option.title || option.name || option.value || `Option ${index + 1}`);

            return {
                value: optionValue?.value || optionValue?.name || optionValue?.id || optionValue,
                label: optionLabel,
                disabled: option.disabled || false,
                ...option // spread any additional properties
            };
        }

        // Fallback for other types
        return {
            value: option?.value || option?.name || option?.id || option,
            label: String(option),
            disabled: false
        };
    });

    // Filter options based on search term
    const filteredOptions = searchable && searchTerm
        ? normalizedOptions.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : normalizedOptions;

    // Get selected option(s) for display
    const getSelectedOptions = () => {
        if (multiple) {
            const selectedValues = Array.isArray(value) ? value : [];
            return normalizedOptions.filter(option => {
                return selectedValues.some(selectedValue => {
                    // Handle string values comparing against object options
                    if (typeof selectedValue === 'string') {
                        return option.value === selectedValue || option.name === selectedValue || option.id === selectedValue;
                    }
                    // Handle object values
                    if (typeof selectedValue === 'object' && selectedValue !== null) {
                        const objValue = selectedValue.value || selectedValue.name || selectedValue.id;
                        return option.value === objValue;
                    }
                    return option.value === selectedValue;
                });
            });
        }

        // console.log('normalizedOptions: ', normalizedOptions);

        // Single selection handling
        const selectedOption = normalizedOptions.find(option => {
            // Handle string value comparing against object options
            if (typeof value === 'string') {
                return option.value === value || option.name === value || option.id === value;
            }
            // Handle object value
            if (typeof value === 'object' && value !== null) {
                const objValue = value.value || value.name || value.id;
                return option.value === objValue;
            }
            return option.value === value;
        });

        return selectedOption || null;
    };

    const selectedOptions = getSelectedOptions();

    // Handle option selection
    const handleSelectOption = (selectedOption) => {
        // console.log('handleSelectOption selectedOption: ', selectedOption);

        if (selectedOption.disabled) return;

        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValues = currentValues.includes(selectedOption.value)
                ? currentValues.filter(v => v !== selectedOption.value)
                : [...currentValues, selectedOption.value];

            onChange({
                target: { name, value: newValues }
            });
        } else {
            onChange({
                target: { name, value: selectedOption.value }
            });
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    // Handle clear selection
    const handleClear = (e) => {
        e.stopPropagation();
        const newValue = multiple ? [] : '';
        onChange({
            target: { name, value: newValue }
        });
        setSearchTerm('');
    };

    // Handle remove single item in multiple mode
    const handleRemoveItem = (e, optionValue) => {
        e.stopPropagation();
        if (multiple && Array.isArray(value)) {
            const newValues = value.filter(v => {
                // Handle string values
                if (typeof v === 'string') {
                    return v !== optionValue;
                }
                // Handle object values
                if (typeof v === 'object' && v !== null) {
                    const objValue = v.value || v.name || v.id;
                    return objValue !== optionValue;
                }
                return v !== optionValue;
            });
            onChange({
                target: { name, value: newValues }
            });
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (disabled) return;

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelectOption(filteredOptions[highlightedIndex]);
                } else if (!isOpen) {
                    setIsOpen(true);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (isOpen) {
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredOptions.length - 1
                    );
                }
                break;
            case ' ':
                if (!searchable && !isOpen) {
                    e.preventDefault();
                    setIsOpen(true);
                }
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlighted index when options change
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [filteredOptions]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    // Render selected value
    const renderSelectedValue = () => {
        if (loading) {
            return <span className="text-gray-500">{loadingText}</span>;
        }

        if (multiple && Array.isArray(value) && value.length > 0) {
            return (
                <div className="flex flex-wrap gap-1">
                    {selectedOptions.map((option, index) => (
                        <span
                            key={option.value}
                            className="inline-flex items-center gap-1 px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-sm"
                        >
                            {renderValue ? renderValue(option) : option.label}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={(e) => handleRemoveItem(e, option.value)}
                                    className="hover:text-gray-900 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            );
        }

        // // console.log('renderValue: ', renderValue);
        // if (placeholder === 'value') {
        //     console.log('selectedOptions ==========: ', multiple, renderValue, selectedOptions,);
        // }

        if (!multiple && selectedOptions) {

            if (renderValue) {
                return renderValue(selectedOptions);
            } else {
                return selectedOptions
                    ? selectedOptions.label || selectedOptions.value || selectedOptions.name || ''
                    : 'null';
            }

        } else {

            return <span className="text-gray-500 overflow-hidden text-nowrap">
                {placeholder}
            </span>;
        }

    };

    return (
        <div
            ref={selectRef}
            className={`relative w-full ${className}`}
        >
            {/* Select trigger */}
            <div
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-required={required}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={handleKeyDown}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    ${className}
                    form-control flex items-center justify-between cursor-pointer
                    transition-all duration-200
                    ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-400'}
                    ${error ? 'border-red-400 focus:outline-red-500' : ''}
                    ${isOpen ? 'border-[var(--ring)] outline-1 outline-offset-1 outline-[var(--ring)]' : ''}
                `}
            >
                <div className={`
                    flex-1 min-w-0 
                    ${typeof renderSelectedValue() === 'string' ? 'overflow-hidden text-nowrap' : ''}
                    `}>
                    {renderSelectedValue()}
                </div>

                <div className="flex items-center gap-2 ml-2">
                    {/* Clear button */}
                    {clearable && !disabled && (
                        (multiple ? (Array.isArray(value) && value.length > 0) : value) && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )
                    )}

                    {/* Dropdown arrow */}
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                            }`}
                    />
                </div>
            </div>

            {/* Error message */}
            {
                error && (
                    <p className="text-sm text-red-500 mt-1 expanding">
                        {error}
                    </p>
                )
            }

            {/* Dropdown */}
            {
                isOpen && (
                    <div
                        ref={dropdownRef}
                        className={`
                        min-w-20
                        absolute top-full left-0 right-0 mt-1 
                        bg-white border border-gray-200 rounded-md shadow-lg z-50
                        slide-up-once-modal
                        ${dropdownClassName}
                    `}
                        style={{ maxHeight }}
                    >
                        {/* Search input */}
                        {searchable && (
                            <div className="p-2 border-b border-gray-200">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search options..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Options list */}
                        <div className="overflow-y-auto slick-scrollbar" style={{ maxHeight: `calc(${maxHeight} - ${searchable ? '60px' : '0px'})` }}>
                            {loading ? (
                                <div className="px-3 py-2 text-gray-500 text-sm">
                                    {loadingText}
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="px-3 py-2 text-gray-500 text-sm">
                                    {noOptionsText}
                                </div>
                            ) : (
                                filteredOptions.map((option, index) => {
                                    let isSelected = false;

                                    if (multiple) {
                                        const selectedValues = Array.isArray(value) ? value : [];
                                        isSelected = selectedValues.some(selectedValue => {
                                            // Handle string values comparing against object options
                                            if (typeof selectedValue === 'string') {
                                                return option.value === selectedValue || option.name === selectedValue || option.id === selectedValue;
                                            }
                                            // Handle object values
                                            if (typeof selectedValue === 'object' && selectedValue !== null) {
                                                const objValue = selectedValue.value || selectedValue.name || selectedValue.id;
                                                return option.value === objValue;
                                            }
                                            return option.value === selectedValue;
                                        });
                                    } else {
                                        // Single selection
                                        if (typeof value === 'string') {
                                            isSelected = option.value === value || option.name === value || option.id === value;
                                        } else if (typeof value === 'object' && value !== null) {
                                            const objValue = value.value || value.name || value.id;
                                            isSelected = option.value === objValue;
                                        } else {
                                            isSelected = option.value === value;
                                        }
                                    }

                                    const isHighlighted = index === highlightedIndex;

                                    return (
                                        <div
                                            key={option.value + '-option-' + index} // Added suffix to ensure unique keys
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => handleSelectOption(option)}
                                            className={`
                                            px-3 py-2 cursor-pointer transition-colors duration-150
                                            flex items-center justify-between
                                            ${option.disabled
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:bg-gray-50'
                                                }
                                            ${isHighlighted ? 'bg-gray-100' : ''}
                                            ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                                        `}
                                        >
                                            <div className="flex-1 min-w-0">
                                                {renderOption ? renderOption(option) : option.label}
                                            </div>

                                            {isSelected && (
                                                <Check className="w-4 h-4 text-blue-600 ml-2" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )
            }

            {/* Hidden input for form submission */}
            {
                name && (
                    <input
                        type="hidden"
                        name={name}
                        value={multiple ? JSON.stringify(value || []) : (value || '')}
                    />
                )
            }
        </div >
    );
};

export default Select;