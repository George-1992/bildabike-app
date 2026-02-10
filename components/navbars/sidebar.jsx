
'use client';

import { SignoutEl } from "@/components/auth";
import Workspaces from "@/components/other/workspaces";
import { pagesMapSidebar } from "@/components/pages";
import { cn } from "@/libs/utils";
import {
    ChevronRight, Home, ListChevronsUpDown, LogOut,
    PanelsTopLeft, User2,
    StretchHorizontal,
    Bot,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME;


const defaultItems = pagesMapSidebar || [
    {
        name: 'Home',
        icon: (props) => <Home {...props} />,
        href: '/',
        subItems: []
    },
    {
        name: 'AI Agent',
        icon: (props) => <Bot {...props} />,
        href: '/ai-agent',
        subItems: []
    },
    {
        name: 'Test',
        icon: (props) => <ListChevronsUpDown {...props} />,
        href: '/test',
        expanded: true,
        subItems: [
            { name: 'sub-test', href: '/test/sub-test', icon: (props) => <StretchHorizontal {...props} /> },
        ]
    },
]

export default function Sidebar({
    items = defaultItems, pathname = '',
    searchParams, session, user, account,
    workspaces = []
}) {

    // console.log('Sidebar render ==> ', pathname);

    // Initialize expanded items with items that have expanded: true
    const getInitialExpandedItems = () => {
        const initialExpanded = new Set();
        items.forEach(item => {
            if (item.expanded === true) {
                initialExpanded.add(item.name);
            }
        });
        return initialExpanded;
    };

    const [expandedItems, setExpandedItems] = useState(getInitialExpandedItems());
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSigningOut, setIsSigningout] = useState(false);

    const toggleExpanded = (itemName) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemName)) {
            newExpanded.delete(itemName);
        } else {
            newExpanded.add(itemName);
        }
        setExpandedItems(newExpanded);
    };


    const isActive = (href) => {
        // if doesnt start with /, add it
        const comparePathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
        let a = comparePathname === href || (href !== '/' && comparePathname.startsWith(href));
        // console.log('isActive check ==> ', a, { href, comparePathname });
        return a;
    };


    const handleThisSignout = async (e) => {
        e.preventDefault();
        setIsSigningout(true);
    }

    // Update expanded items when items prop changes
    useEffect(() => {
        const newExpanded = new Set(expandedItems);
        items.forEach(item => {
            if (item.expanded === true && !newExpanded.has(item.name)) {
                newExpanded.add(item.name);
            }
        });
        setExpandedItems(newExpanded);
    }, [items]);

    // Update CSS variable when collapse state changes
    useEffect(() => {
        try {
            const root = document.documentElement;
            // Use requestAnimationFrame to ensure smooth transition
            requestAnimationFrame(() => {
                if (isCollapsed) {
                    root.style.setProperty('--sidebar-width', '64px'); // collapsed (matches w-16)
                } else {
                    root.style.setProperty('--sidebar-width', '200px'); // expanded (matches w-64)
                }
            });
        } catch (error) {
            // console.error('CSS variable update error ==> ', error);
        }
    }, [isCollapsed]);

    // console.log('Sidebar user ==> ', user);

    const fullName = user && user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : 'n/a';



    if (isSigningOut) {
        return <SignoutEl />;
    };
    if (pathname.startsWith('/auth/')) {
        return null;
    };

    return (
        <div className={`relative h-screen border-r-2 border-gray-200 bg-gray-50 flex flex-col flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
            }`}>
            {/* Header */}
            <div className={cn(
                'w-full h-28 overflow-hidden border-b-[1.5px] border-gray-200 flex flex-col',
                isCollapsed ? 'items-center justify-center py-1 px-1' : 'items-start py-3 px-3',
            )}>
                <div className="flex items-center justify-between ">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <Image
                            src="/images/logos/main.png"
                            alt="Logo"
                            width={25}
                            height={25}
                        />
                        {!isCollapsed && (
                            <div className="text-lg font-semibold ">
                                {PROJECT_NAME || 'My App'}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        data-id='collapse-sidebar-btn'
                        className="p-1 rounded hover:bg-gray-100 transition-colors absolute -right-10 top-5 transform -translate-y-1/2"
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <PanelsTopLeft className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <Workspaces
                    session={session}
                    user={user} account={account}
                    isCollapsed={isCollapsed} workspaces={workspaces}
                />

            </div>

            {/* Navigation */}
            <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-2'} overflow-hidden`}>
                <ul className="space-y-2  overflow-y-auto h-[calc(100vh-200px)] slick-scroll">
                    {items.map((item, index) => (
                        <li key={item.name + `-${index}`} className="">
                            <div className="relative ">
                                {/* Main item */}
                                {item.subItems && item.subItems.length > 0 ? (
                                    // Items with submenus - entire item is clickable to expand
                                    <button
                                        onClick={() => toggleExpanded(item.name)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                                            ${isActive(item.href)
                                                ? 'bg-gray-200 text-[var(--primary-foreground)]'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1">{item.name}</span>
                                                <ChevronRight
                                                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0
                                                        ${expandedItems.has(item.name) ? 'rotate-90' : ''}`}
                                                />
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    // Items without submenus - regular link
                                    <Link
                                        href={item.href}
                                        className={` flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${isCollapsed ? 'w-fit justify-center' : 'w-full justify-start gap-3'}
                                            ${isActive(item.href)
                                                ? 'bg-gray-200 text-[var(--primary-foreground)]'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        {!isCollapsed && <span>{item.name}</span>}
                                    </Link>
                                )}

                                {/* Sub items */}
                                {item.subItems && item.subItems.length > 0 && expandedItems.has(item.name) && !isCollapsed && (
                                    <ul className="mt-2 ml-8 space-y-1">
                                        {item.subItems.map((subItem) => (
                                            <li key={subItem.name}>
                                                <Link
                                                    href={subItem.href}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                                                        ${isActive(subItem.href)
                                                            ? 'bg-gray-100 text-[var(--primary-foreground)]'
                                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                                        }`}
                                                >
                                                    {subItem.icon && <subItem.icon className="w-4 h-4 flex-shrink-0" />}
                                                    <span>{subItem.name}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </li>
                    ))}

                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t-[1.5px] border-gray-200">
                <div className={`flex items-center gap-3 px-3 py-2 ${isCollapsed ? 'justify-center' : ''}`}>
                    {isCollapsed &&
                        <button className="p-1 rounded hover:bg-gray-100" title="Logout" onClick={handleThisSignout}>
                            <LogOut className="w-4 h-4 text-gray-500" />
                        </button>
                    }
                    {!isCollapsed && (
                        <>
                            <div className="bg-gray-200 rounded-full p-1">
                                <User2 className="size-5 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{session?.email}</p>
                            </div>
                            <button className="p-1 rounded hover:bg-gray-100" title="Logout" onClick={handleThisSignout}>
                                <LogOut className="w-4 h-4 text-gray-500" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}