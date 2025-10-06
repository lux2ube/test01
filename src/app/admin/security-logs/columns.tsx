"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import type { ActivityLog } from "@/types"
import { format } from "date-fns"

const getEventText = (event: ActivityLog['event']) => {
    const texts = {
        'login': 'تسجيل دخول',
        'signup': 'تسجيل جديد',
        'withdrawal_request': 'طلب سحب',
        'store_purchase': 'شراء من المتجر',
    };
    return texts[event] || event;
}

const getEventVariant = (event: ActivityLog['event']) => {
    switch (event) {
        case 'login': return 'default';
        case 'signup': return 'secondary';
        case 'withdrawal_request': return 'outline';
        case 'store_purchase': return 'outline';
        default: return 'outline';
    }
}

export const getColumns = (): ColumnDef<ActivityLog>[] => [
    {
        accessorKey: "timestamp",
        header: "الوقت",
        cell: ({ row }) => <div className="text-xs text-muted-foreground whitespace-nowrap">{format(row.original.timestamp, 'PPp')}</div>
    },
    {
        accessorKey: "event",
        header: "الحدث",
        cell: ({ row }) => (
            <Badge variant={getEventVariant(row.original.event)} className="capitalize">
                {getEventText(row.original.event)}
            </Badge>
        )
    },
    {
        accessorKey: "userId",
        header: "معرف المستخدم",
        cell: ({ row }) => <div className="font-mono text-xs">{row.original.userId.substring(0, 10)}...</div>
    },
    {
        id: 'location',
        header: "الموقع",
        cell: ({ row }) => (
            <div>
                <div className="text-xs">{row.original.geo?.city}, {row.original.geo?.country || 'غير معروف'}</div>
                <div className="text-xs text-muted-foreground font-mono">{row.original.ipAddress}</div>
            </div>
        )
    },
    {
        accessorKey: "userAgent",
        header: "متصفح المستخدم",
        cell: ({ row }) => <div className="text-xs text-muted-foreground truncate max-w-xs">{row.original.userAgent}</div>
    }
]
