'use client';
import Turnstile, { useTurnstile } from "react-turnstile";

export default function TurnstileEl({ onVerify }) {
    const CF_TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY

    return (
        <Turnstile
            sitekey={CF_TURNSTILE_SITE_KEY}
            onVerify={(token) => {
                if (onVerify) {
                    onVerify(token)
                }
            }}
        />
    )
}