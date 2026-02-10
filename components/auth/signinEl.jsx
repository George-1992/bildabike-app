'use client';

import { createSession } from "@/actions/auth";
import { Loader, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function SigninEl({ signResData }) {

    const pathnameNext = usePathname();
    const thisPathname = pathnameNext;
    // console.log('SigninEl signResData ==> ', signResData);

    const data = signResData && signResData.success && signResData.data
        ? Array.isArray(signResData.data)
            ? signResData.data[0]
            : signResData.data
        : null;
    // console.log('SigninEl data ==> ', data);


    useEffect(() => {
        const body = async () => {
            try {
                // if (thisPathname.startsWith('/auth/')) {
                //     return;
                // }

                // dummy 2s delay to show the loader
                await new Promise(resolve => setTimeout(resolve, 1200));

                const sessionRes = await createSession(data);
                // console.log('SigninEl sessionRes ==> ', sessionRes);

                // if (res.success) {
                //     window.location.href = '/auth/signin';
                // }
            } catch (error) {
                console.error('Error during signout:', error);
            }
        };
        body();

    }, []);


    return (
        <div className="w-full h-screen fixed z-10 top-0 left-0 bg-white flex items-center justify-center">
            <div className="flex items-center gap-3">
                <Loader2 className="animate-spin inline-block" />
                Signing in...
            </div>
        </div>
    );
}