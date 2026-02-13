'use client';

import startScrape from "@/actions/scrape";

export default function TestButton({ workspace }) {
    const handleClick = async () => {
        console.log('Button clicked!');
        const scrapeRes = await startScrape({
            workspaceId: workspace.id,
            source: 'test'
        });
        console.log('Scrape result:', scrapeRes);
    }
    return (
        <div className="fixed bottom-4 right-4 bg-red-100 p-2 rounded">
            <button onClick={handleClick} className="px-4 py-2 bg-blue-500 text-white rounded">
                Test Button
            </button>
        </div>
    );
}