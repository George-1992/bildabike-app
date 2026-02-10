export default function StatusItem({ status }) {
    return (
        <div className={`p-1 rounded-md
            ${status === 'active' ? 'bg-green-200 text-green-800' : ''}
            ${status === 'inactive' ? 'bg-gray-200 text-gray-800' : ''}
            ${status === 'pending' ? 'bg-yellow-200 text-yellow-800' : ''}
            ${status === 'banned' ? 'bg-red-200 text-red-800' : ''}
            ${status === 'archived' ? 'bg-gray-400 text-gray-900' : ''}
            ${!['active', 'inactive', 'archived', 'pending', 'banned'].includes(status) ? 'bg-gray-200 text-gray-800' : ''}
        `}>
            {status}
        </div>
    );
}