
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyOrdersPageRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/store');
    }, [router]);

    return null; // Or a loading spinner
}
