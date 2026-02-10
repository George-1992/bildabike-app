'use client';

import { extendSession } from "@/actions/auth";
import { useEffect } from "react";

export default function ExtenSession({ session, pathname }) {

 
    useEffect(() => {
        if (session && session.exp) {
            extendSession(session);
        }
    }, [pathname]);

    return (
        <div className="session"></div>
    );
}