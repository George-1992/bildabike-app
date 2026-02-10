export default function AlertBox({ message = 'n/a', type = 'info', children }) {


    if (type === 'error') {
        return <div className="p-4 mb-4 text-sm shadow-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            {children || message}
        </div>;
    } else if (type === 'warning') {
        return <div className="p-4 mb-4 text-sm shadow-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
            {children || message}
        </div>;
    } else if (type === 'success') {
        return <div className="p-4 mb-4 text-sm shadow-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
            {children || message}
        </div>;
    } else {

        // default to info
        return (
            <div className="p-4 mb-4 text-sm shadow-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                {children || message}
            </div>
        );
    }
}