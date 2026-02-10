'use client';

import { useState, Children, cloneElement, useEffect } from 'react';

const TabTrigger = (props) => {
    return (
        <button
            className={`flex flex-1 text-sm font-semibold items-center justify-center text-center  
                ${props.isActive
                    ? 'bg-background text-foreground rounded-md shadow-sm bg-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                } 
                ${props.className ? props.className : 'p-1.5'}
                `}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    );
};

const TabItem = ({ children, isActive }) => {
    return (
        <div className={`${isActive ? 'block' : 'hidden'}`}>
            {children}
        </div>
    );
};

const Tabs = ({ children, defaultIndex = 0, className = '', onChange = () => { } }) => {
    const [activeIndex, setActiveIndex] = useState(defaultIndex);

    // Filter Tab components and extract their props
    const tabTriggers = Children.toArray(children).filter(
        child => child.props?.type === 'trigger' || child.type?.displayName === 'TabTrigger'
    );

    const tabItems = Children.toArray(children).filter(
        child => child.props?.type === 'item' || child.type?.displayName === 'TabItem'
    );

    useEffect(() => {
        onChange(activeIndex);
    }, [activeIndex, onChange]);

    return (
        <div className={`w-full ${className}`}>
            <div className="w-full flex p-1 mb-2 items-center rounded-md bg-gray-100">
                {tabTriggers.map((trigger, idx) => (
                    <TabTrigger
                        {...trigger.props}
                        key={idx}
                        isActive={activeIndex === idx}
                        onClick={() => trigger.props.onClick ? trigger.props.onClick() : setActiveIndex(idx)}
                    >
                        {trigger.props.children}
                    </TabTrigger>
                ))}
            </div>

            <div className=''>
                {tabItems.map((item, idx) => (
                    <TabItem
                        {...item.props}
                        key={idx}
                        isActive={activeIndex === idx}
                    >
                        {item.props.children}
                    </TabItem>
                ))}
            </div>
        </div>
    );
};

// Export individual components for direct use
export { TabTrigger, TabItem };

// Export main component as default
export default Tabs;