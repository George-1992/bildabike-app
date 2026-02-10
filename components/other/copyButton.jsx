'use client';

import { Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notify } from '@/components/sonnar/sonnar';

export default function CopyButton({ text = '', duration = 2000 }) {
    const [_isCopied, _setIsCopied] = useState(false);

    useEffect(() => {
        if (_isCopied) {
            const timer = setTimeout(() => {
                _setIsCopied(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [_isCopied, duration]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            _setIsCopied(true);
            // notify({ type: 'success', message: 'Copied to clipboard' });
        } catch (error) {
            notify({ type: 'error', message: 'Failed to copy' });
        }
    };

    return (
        <button
            onClick={handleCopy}
            disabled={!text}
            className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={text ? 'Copy to clipboard' : 'No text to copy'}
        >
            {_isCopied ? (
                <Check className="w-4 h-4 text-gray-500" />
            ) : (
                <Copy className="w-4 h-4 text-gray-600" />
            )}
        </button>
    );
}