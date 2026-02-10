export default function StatusItem({ status, children }) {
    return (
        <div className={`p-1 rounded-md
            ${status === 'notStarted' ? 'bg-gray-200 text-gray-800' : ''}
            ${status === 'inProgress' ? 'bg-blue-200 text-blue-800' : ''}
            ${status === 'completed' ? 'bg-green-200 text-green-800' : ''}
            ${status === 'onHold' ? 'bg-yellow-200 text-yellow-800' : ''}
            ${status === 'done' ? 'bg-purple-200 text-purple-800' : ''}
        `}>
            {children || status}
        </div>
    );
}