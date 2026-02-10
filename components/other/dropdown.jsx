'use client';

import React, { useState, useEffect } from 'react';

export const DropdownTrigger = (props) => {
    const children = props.children
    const otherProps = { ...props }
    delete otherProps.children
    otherProps['data-type'] = 'trigger'

    // Option 1: Add the property before spreading
    return <div {...otherProps} data-type="trigger">{children}</div>;

    // Option 2: Or modify otherProps first
    // otherProps.type = 'aaa';
    // return <div {...otherProps}>{children}</div>;
};
DropdownTrigger.displayName = 'DropdownTrigger';

export const DropdownContent = (props) => {
    const children = props.children
    const otherProps = { ...props }
    delete otherProps.children
    return <div data-type="content" {...otherProps}>{children}</div>;
};
DropdownContent.displayName = 'DropdownContent';

export const Dropdown = ({
    children = [], fixed = false, onOpen = () => { },
    className = '',
    buttonClassName = '',
    isOpen = null,
}) => {

    const [_isOpen, _setIsOpen] = useState(isOpen);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const childrenArray = React.Children.toArray(children);


    const getDisplayName = (reElement) => {
        try {
            if (!reElement || !reElement.type || !reElement.type._payload) return ''

            let name = '';
            const values = reElement.type._payload?.value || []
            name = values[values.length - 1]
            // if (!name) {
            //     name = reElement.type._payload?.value
            // }

            return name
        } catch (error) {
            return ''
        }
    }


    const Trigger = childrenArray.find(child => {
        // Check the props of the rendered div element
        return child.props?.['data-type'] === 'trigger'
    });

    const Content = childrenArray.find(child =>
        child.props?.['data-type'] === 'content'
    );


    // console.log('Trigger ==> ', Trigger ? true : 'no trigger');
    // console.log('Content ==> ', Content ? true   : 'no content');

    useEffect(() => {
        if (isOpen !== null) {
            _setIsOpen(isOpen);
        }
    }, [isOpen]);

    useEffect(() => {
        // if its open, add event listener to close on outside click and scroll
        const handleClickOutside = (event) => {
            // Check if click is inside dropdown content or trigger
            const clickedInContent = event.target.closest('[data-dropdown-content]');
            const clickedInTrigger = event.target.closest('[data-dropdown-trigger]');
            
            // Don't close if clicked inside content or trigger
            if (clickedInContent || clickedInTrigger) {
                return;
            }
            
            // Close dropdown if clicked outside
            _setIsOpen(false);
            onOpen(false);
        };

        const handleScroll = () => {
            if (fixed && _isOpen) {
                _setIsOpen(false);
                onOpen(false);
            }
        };

        if (_isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            if (fixed) {
                // document.addEventListener('scroll', handleScroll, true); // true for capture phase
            }
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
            if (fixed) {
                // document.removeEventListener('scroll', handleScroll, true);
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (fixed) {
                // document.removeEventListener('scroll', handleScroll, true);
            }
        };
    }, [_isOpen, fixed]);
    const handleTriggerClick = (event) => {
        if (fixed && !_isOpen) {
            // Calculate position for fixed positioning
            const rect = event.currentTarget.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 8, // 8px offset like mt-2
                left: rect.right + window.scrollX - 192 // 192px is w-48 width, align to right
            });
        }
        _setIsOpen(!_isOpen);
        onOpen(!_isOpen);
    };

    return (
        <div className={`${className ? className : 'w-full '}`}>
            <button
                className={buttonClassName}
                onClick={handleTriggerClick}
                data-dropdown-trigger="true"
            >
                {Trigger}
            </button>
            {
                _isOpen && (
                    <div
                        className={`min-w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 ${fixed
                            ? 'fixed'
                            : 'absolute right-0 mt-2'
                            }`}
                        style={fixed ? {
                            top: `${position.top}px`,
                            left: `${position.left}px`
                        } : {}}
                        data-dropdown-content="true"
                    >
                        {Content}
                    </div>
                )
            }
        </div>
    );
};
