'use client';

import { useEffect, useState, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { cn } from '@/libs/utils';
import { ArrowUpIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import rehypeHighlight from 'rehype-highlight';

export default function AiAgent({ className, account, user }) {
    const { messages, status, sendMessage } = useChat();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // container height settings
    const minHeight = 150; // minimum container height
    const maxHeight = 300; // maximum container height
    const padding = 40; // container padding (p-5 = 20px top + 20px bottom)
    const [isDisabled, setIsDisabled] = useState(false);
    const [inputHeight, setInputHeight] = useState(minHeight);


    const handleSubmit = e => {
        e.preventDefault();
        if (input.trim() && !isDisabled) {
            sendMessage({ text: input });
            setInput('');
        }
    };
    const handleKeyDown = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() && !isDisabled) {
                sendMessage({ text: input });
                setInput('');
            }
        }
        // Shift+Enter will create a new line (default behavior)
    };
    useEffect(() => {
        if (status === 'loading' || status === 'error' || input.trim() === '') {
            setIsDisabled(true);
        } else {
            setIsDisabled(false);
        }

        // adjust textarea height based on content
        const lineHeight = 24;

        if (input) {
            // Count actual line breaks in the input
            const lines = input.split('\n').length;

            // Estimate lines based on character width (assuming ~50 chars per line for responsive design)
            const charsPerLine = 50;
            const estimatedWrappedLines = Math.ceil(input.length / charsPerLine);

            // Use the greater of actual lines or estimated wrapped lines
            const totalLines = Math.max(lines, estimatedWrappedLines);

            // Calculate required height: (lines * lineHeight) + padding + button space
            const calculatedHeight = Math.max(
                minHeight,
                Math.min(maxHeight, (totalLines * lineHeight) + padding + 50)
            );

            setInputHeight(calculatedHeight);
        } else {
            setInputHeight(minHeight);
        }

    }, [status, input]);
    // Auto-scroll to bottom when new messages arrive or during streaming
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, status]);
    // Also scroll when a message is being streamed
    useEffect(() => {
        if (status === 'streaming') {
            const timer = setTimeout(scrollToBottom, 100);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // console.log('messages: ', status, messages);

    return (
        <div className={cn(
            'chat-container relative  overflow-y-auto',
            'w-full h-[calc(100vh-270px)]',
            'flex flex-col items-center',
            className && className,
        )}>
            <div className={`chat w-[700px] h-full flex flex-col`}>

                {/* messages */}
                <div
                    ref={messagesContainerRef}
                    className={cn(
                        'messages',
                        'flex-1 flex flex-col gap-3 w-full max-w-full',
                        'slick-scrollbar',
                        'scroll-smooth',
                        'pb-4'
                    )}
                >
                    {/* <div className='w-60 h-[750px] flex-shrink-0 bg-red-300'>placeholder</div> */}

                    {messages.map((message, msgIndex) => (
                        <div
                            key={message.id}
                            className={cn(
                                'leading-loose',
                                'flex items-center',
                                message.role === 'user'
                                    ? 'justify-end'
                                    : ''
                            )}
                        >
                            {/* <strong>{`${message.role}: `}</strong> */}
                            {message.parts.map((part, index) => {

                                const isLastMsg = msgIndex === messages.length - 1;

                                if (part.type === 'text') {
                                    return (
                                        <div key={index}
                                            className={cn(
                                                'p-3 rounded-3xl max-w-[80%]',
                                                message.role === 'user'
                                                    ? 'bg-gray-100 px-5'
                                                    : ''
                                            )}
                                        >
                                            {message.role === 'user' ? (
                                                // Plain text for user messages
                                                <span>{part.text}</span>
                                            ) : (
                                                <>

                                                    {/*Markdown rendering for AI messages */}
                                                    <div className="prose prose-sm max-w-none">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            rehypePlugins={[rehypeHighlight]}
                                                            components={{
                                                                code: ({ node, inline, className, children, ...props }) => {
                                                                    const match = /language-(\w+)/.exec(className || '');
                                                                    return !inline ? (
                                                                        <pre className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto">
                                                                            <code className={className} {...props}>
                                                                                {children}
                                                                            </code>
                                                                        </pre>
                                                                    ) : (
                                                                        <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                                                                            {children}
                                                                        </code>
                                                                    );
                                                                },
                                                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                                                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                                                blockquote: ({ children }) => (
                                                                    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">
                                                                        {children}
                                                                    </blockquote>
                                                                ),
                                                                h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                                                                h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                                                                h3: ({ children }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
                                                            }}
                                                        >
                                                            {part.text}
                                                        </ReactMarkdown>


                                                    </div>



                                                    {/* Loading indicator */}
                                                    {isLastMsg && ['submitted ', 'submitted'].includes(status) &&
                                                        <div className={cn(
                                                            'w-3 h-3 mt-2',
                                                            'bg-neutral-950 animate-bounce rounded-full',
                                                        )} />
                                                    }

                                                </>
                                            )}
                                        </div>
                                    );
                                } else {
                                    // other cases can handle images, tool calls, etc
                                }
                            })}
                        </div>
                    ))}

                    {/* Loading indicator when AI is generating a response rg submitted */}
                    {['submitted'].includes(status) && (
                        <div className="flex items-center">
                            <div className="p-3 rounded-3xl max-w-[80%]">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span className="text-sm text-neutral-500">thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* message box - sticky at bottom */}
                <div className="sticky bottom-0 w-full bg-white pt-4">
                    <form onSubmit={handleSubmit}>
                        <div className={cn(
                            'w-full p-5',
                            'flex flex-col items-end justify-start',
                            'shadow-sm rounded-3xl flex items-center gap-2',
                            'bg-gray-100 border border-gray-300',
                            'transition-all duration-200 ease-in-out',
                        )}
                            style={{ height: inputHeight }}
                        >
                            <div className='w-full flex flex-1 items-start justify-start'>
                                <textarea
                                    value={input}
                                    name='message'
                                    className='w-full h-full bg-gray-100 focus:ring-0 focus:outline-none resize-none'
                                    placeholder="Send a message... (Press Enter to send, Shift+Enter for new line)"
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={status !== 'ready'}
                                />
                            </div>
                            <div className='w-full flex items-center justify-end'>
                                <button
                                    type="submit"
                                    className={cn(
                                        'p-2 rounded-full',
                                        isDisabled && 'opacity-55',
                                        'bg-neutral-800 text-white',
                                    )}
                                    disabled={isDisabled}
                                >
                                    <ArrowUpIcon className='size-6' />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>


                {/* Invisible div to scroll to */}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}