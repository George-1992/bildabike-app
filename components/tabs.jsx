'use client';
import { useState } from 'react';

export const TabContainer = ({ children, defaultIndex = 0 }) => {
    const [activeIndex, setActiveIndex] = useState(defaultIndex);

    // Filter Tab components and extract their props
    const tabs = React.Children.toArray(children).filter(
        child => child.type.displayName === 'Tab'
    );

    return (
        <div>
            <div className="flex border-b">
                {tabs.map((tab, idx) => (
                    <button
                        key={idx}
                        className={`px-4 py-2 focus:outline-none ${activeIndex === idx ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
                        onClick={() => setActiveIndex(idx)}
                    >
                        {tab.props.label}
                    </button>
                ))}
            </div>
            <div className="p-4">
                {tabs[activeIndex]}
            </div>
        </div>
    );
};

export const Tab = ({ children }) => {
    return <div>{children}</div>;
};
Tab.displayName = 'Tab';
