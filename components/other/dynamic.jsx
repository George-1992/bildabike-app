'use client';

import dynamic from "next/dynamic";

const ClientOnly = dynamic(
    () =>
        Promise.resolve(function ClientOnlyInner({
            children,
            fallback = null,
            className = "",
        }) {
            return (
                <div className={className}>
                    {children ?? fallback}
                </div>
            );
        }),
    {
        ssr: false,
        loading: () => null,
    }
);

export default function DynamicEl({
    children,
    fallback = null,
    className = "",
}) {
    return (
        <ClientOnly fallback={fallback} className={className}>
            {children}
        </ClientOnly>
    );
}
