'use client';

import AlertBox from "@/components/other/alertBox";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export default function AccountMessages({ pathname, data, searchParams, session, user, account }) {

    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const isPending = user && user.status === 'pending';
        if (isPending) {
            const newMessages = [...messages];
            newMessages.push({
                id: 'pending',
                type: 'error',
                text: 'Your account is pending approval. Some features may be restricted.'
            });
            setMessages(newMessages);
        }
    }, []);

    return (
        <div className="account-messages fixed top-0 left-1/2 transform -translate-x-1/2 max-w-96 z-50 flex items-center justify-center mt-1" style={{}}>
            {messages.map(msg => {
                return <div key={msg.id} className="w-96 relative">
                    <AlertBox type={msg.type}>
                        {msg.text}
                    </AlertBox>

                    <button
                        onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                        className="absolute top-0 right-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="size-4 text-gray-500" />
                    </button>
                </div>;
            })}
        </div>
    )
}