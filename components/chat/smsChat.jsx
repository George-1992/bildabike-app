'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Send, MessageSquare, Phone, User, Loader2,
    RefreshCw, Copy, Check, MoreVertical,
    AlertCircle
} from 'lucide-react';
import { notify } from '@/components/sonnar/sonnar';

const sampleData = [
    // {//message from crm
    //     type: 'crm',
    //     text: 'Hello! How can I assist you today?',
    //     timestamp: '1265467890',
    //     from: '+1234567890',
    //     to: '+0987654321',
    //     sid: 'SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    // },
    // { //reply from user
    //     type: 'user',
    //     text: 'I would like to know more about your services.',
    //     timestamp: '1265467891',
    //     from: '+0987654321',
    //     to: '+1234567890',
    //     sid: 'SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX2'
    // }
];

export default function SmsChat({
    data = sampleData,
    onChange = () => { },
    className = '',
    maxHeight = "500px",
    contactPhone = null,
    isLoading: externalLoading = false
}) {
    const [messages, setMessages] = useState(data || sampleData);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const [error, setError] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Update messages when data prop changes
    useEffect(() => {
        if (data && Array.isArray(data)) {
            setMessages(data);
        }
    }, [data]);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        return;
        if (messagesEndRef.current && messagesEndRef.current.parentElement) {
            // Scroll the messages container to bottom, not the entire page
            const container = messagesEndRef.current.parentElement;
            container.scrollTop = container.scrollHeight;
        }
    };

    // useEffect(() => {
    //     scrollToBottom();
    // }, [messages]);

    // // Focus input when component mounts
    // useEffect(() => {
    //     if (inputRef.current) {
    //         inputRef.current.focus();
    //     }
    // }, []);

    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
        try {
            // Handle both Unix timestamp (seconds) and milliseconds
            const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
            const date = new Date(ts * (ts.toString().length === 10 ? 1000 : 1));

            const now = new Date();
            const messageDate = new Date(date);
            const isToday = messageDate.toDateString() === now.toDateString();

            if (isToday) {
                return messageDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                return messageDate.toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Format phone number for display
    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            const areaCode = cleaned.slice(1, 4);
            const first = cleaned.slice(4, 7);
            const second = cleaned.slice(7, 11);
            return `+1 (${areaCode}) ${first}-${second}`;
        } else if (cleaned.length === 10) {
            const areaCode = cleaned.slice(0, 3);
            const first = cleaned.slice(3, 6);
            const second = cleaned.slice(6, 10);
            return `(${areaCode}) ${first}-${second}`;
        }
        return phone;
    };

    // Send SMS message
    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || externalLoading) return;

        const messageText = input.trim();
        setInput('');
        setIsLoading(true);
        setError(null);

        // Create temporary message for immediate UI feedback
        const tempMessage = {
            id: `temp-${Date.now()}`,
            type: 'crm',
            text: messageText,
            timestamp: Date.now().toString(),
            to: contactPhone || '+0987654321',
            sid: 'pending',
            status: 'sending'
        };

        const updatedMessages = [...messages, tempMessage];
        setMessages(updatedMessages);

        try {
            // TODO: Replace with actual Twilio API call
            // const response = await sendSmsMessage({
            //     to: contactPhone,
            //     body: messageText
            // });

            // Simulate API call for now
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

            // Update the temporary message with successful response
            const finalMessage = {
                ...tempMessage,
                id: `msg-${Date.now()}`,
                sid: `SM${Math.random().toString(36).substr(2, 32).toUpperCase()}`,
                status: 'sent',
                timestamp: Date.now().toString()
            };

            const finalMessages = updatedMessages.map(msg =>
                msg.id === tempMessage.id ? finalMessage : msg
            );

            setMessages(finalMessages);
            onChange(finalMessages);
            notify({ type: 'success', message: 'SMS sent successfully!' });

        } catch (error) {
            console.error('Error sending SMS:', error);

            // Remove the temporary message and show error
            setMessages(messages);
            setError('Failed to send SMS. Please try again.');
            notify({ type: 'error', message: 'Failed to send SMS message' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleCopyMessage = async (messageId, content) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
            notify({ type: 'success', message: 'Message copied to clipboard' });
        } catch (error) {
            notify({ type: 'error', message: 'Failed to copy message' });
        }
    };

    const handleRefresh = () => {
        // TODO: Implement refresh functionality to fetch latest messages
        notify({ type: 'info', message: 'Refreshing messages...' });
    };

    return (
        <div className={`h-96 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-1 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <div className="flex items-center gap-2">
                    {/* <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div> */}
                    {/* <div>
                        <h3 className="font-medium text-gray-900">SMS Chat</h3>
                        <p className="text-xs text-gray-500">
                            {contactPhone ? formatPhoneNumber(contactPhone) : 'No contact selected'}
                        </p>
                    </div> */}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading || externalLoading}
                        className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                        title="Refresh messages"
                    >
                        <RefreshCw className={`w-4 h-4 ${(isLoading || externalLoading) ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Messages Container */}
            <div
                className="flex-1 overflow-y-auto p-3 space-y-3 slick-scrollbar"
                style={{ maxHeight }}
            >
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs text-gray-400 mt-1">Start a conversation by sending a message</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id || message.sid}
                            className={`flex gap-2 ${message.type === 'crm' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.type === 'user' && (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <User className="w-3 h-3 text-white" />
                                </div>
                            )}

                            <div
                                className={`max-w-[80%] rounded-lg px-3 py-2 relative group ${message.type === 'crm'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-800'
                                    } ${message.status === 'sending' ? 'opacity-70' : ''}`}
                            >
                                <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                                <div className={`text-xs mt-1 opacity-70 flex items-center gap-1 ${message.type === 'crm' ? 'text-green-100' : 'text-gray-500'
                                    }`}>
                                    <span>{formatTimestamp(message.timestamp)}</span>
                                    {message.status === 'sending' && (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    )}
                                </div>

                                {/* Copy button */}
                                <button
                                    onClick={() => handleCopyMessage(message.id || message.sid, message.text)}
                                    className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${message.type === 'crm'
                                        ? 'hover:bg-green-600'
                                        : 'hover:bg-gray-200'
                                        }`}
                                    title="Copy message"
                                >
                                    {copiedMessageId === (message.id || message.sid) ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <Copy className="w-3 h-3" />
                                    )}
                                </button>
                            </div>

                            {message.type === 'crm' && (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <Phone className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-3">
                <div className="flex w-full border border-gray-300 rounded-lg px-3 py-2 text-sm   disabled:bg-gray-50 disabled:cursor-not-allowed">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your SMS message..."
                        disabled={isLoading || externalLoading || !contactPhone}
                        rows={1}
                        className="w-full flex-1 resize-none focus:outline-none focus:ring-0 "
                        style={{
                            minHeight: '38px',
                            // maxHeight: '120px'
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading || externalLoading || !contactPhone}
                        className="w-8 h-8 bg-white border border-gray-300 rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        title={!contactPhone ? "No contact phone number" : "Send SMS"}
                    >
                        {(isLoading || externalLoading) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {/* <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    {input.length > 0 && (
                        <span className={`${input.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                            {input.length}/160
                        </span>
                    )}
                </div> */}
            </div>
        </div>
    );
}