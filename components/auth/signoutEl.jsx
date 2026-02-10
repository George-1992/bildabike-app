'use client';

import { handleSignout } from "@/actions/auth";
import { Loader, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function SignoutEl({ pathname = '' }) {

    const pathnameNext = usePathname();
    const thisPathname = pathname || pathnameNext;
    // console.log('thisPathname ==> ', thisPathname);


    useEffect(() => {
        const signout = async () => {
            try {
                if (thisPathname.startsWith('/auth/')) {
                    return;
                }

                // dummy 2s delay to show the loader
                await new Promise(resolve => setTimeout(resolve, 1200));

                const res = await handleSignout();
                console.log(res);
                if (res.success) {
                    window.location.href = '/auth/signin';
                }
            } catch (error) {
                console.error('Error during signout:', error);
            }
        };
        signout();

    }, []);


    return (
        <div className="w-full h-screen fixed z-10 top-0 left-0 bg-white flex items-center justify-center">
            <div>
                <Loader2 className="animate-spin mr-2 inline-block" />
                Signing out...
            </div>
        </div>
    );
}