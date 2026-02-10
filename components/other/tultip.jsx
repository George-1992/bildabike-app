export default function Tooltip({ children, text }) {
    if (!text && !children) {
        return null;
    }

    return (
        <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50'>
            {text}
            {children}
        </div>
    );
}