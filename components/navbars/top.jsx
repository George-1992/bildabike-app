'use client';

import { useState } from "react";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/components/other/dropdown";
import { Settings, User, LogOut, UserIcon, Bell, Search, SearchIcon } from "lucide-react";
import Link from "next/link";
import { SignoutEl } from "@/components/auth";
import AlertBox from "@/components/other/alertBox";

export default function TopNav({ pathname, data, searchParams, session, user, account }) {

    const [isSigningOut, setIsSigningout] = useState(false);

    // console.log('TopNav session ==> ', session);


    const handleThisSignout = async (e) => {
        e.preventDefault();
        setIsSigningout(true);
    }


    // console.log('Sidebar user ==> ', user);

    const fullName = user && user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : 'n/a';



    if (isSigningOut) {
        return <SignoutEl />;
    }

    return (
        <div className="w-full h-14 flex py-2 px-4 items-center justify-between ">
            {/* first part */}
            <div className="flex-1"></div>
            {/* second part */}
            <div className="flex gap-4 items-center justify-center">
                {/* <div className="flex items-center space-x-4">
                    <div type="trigger" className="flex items-center justify-center p-2 bg-gray-200 rounded-full   ">
                        <Settings className="h-5 w-5 text-gray-600" />
                    </div>
                </div> */}

                <div className="w-44 border border-gray-300 h-8 gap-2 flex items-center px-2 rounded-md cursor-not-allowed">
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                    <input
                        className="instead-input w-10/12 bg-white cursor-not-allowed"
                        placeholder="Search..."
                        disabled
                    />
                </div>

                <div className="flex items-center justify-center p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors cursor-pointer">
                    <Bell className="h-5 w-5 text-gray-600 " />
                </div>

                <Dropdown className="w-12">
                    <div data-type="trigger" className="flex items-center justify-center p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                        <Settings className="h-5 w-5 text-gray-600" />
                    </div>
                    <div data-type="content" className="w-48 right-0">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <p className="font-medium text-gray-900">{fullName}</p>
                            <p className="text-sm text-gray-500">{session?.email || 'No email'}</p>
                        </div>
                        <div className="py-1">
                            <Link href='/profile' className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <UserIcon className="w-4 h-4" />
                                Profile
                            </Link>
                            <Link href='/settings' className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <Settings className="w-4 h-4" />
                                Settings
                            </Link>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button onClick={handleThisSignout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </Dropdown>

            </div>
        </div>
    );
}