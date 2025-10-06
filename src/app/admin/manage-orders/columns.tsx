"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { MoreHorizontal } from "lucide-react"
import { format } from 'date-fns'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/types"

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'Delivered': return 'default';
        case 'Pending': return 'secondary';
        case 'Shipped': return 'outline';
        case 'Cancelled': return 'destructive';
        default: return 'outline';
    }
};
    
const getStatusText = (status: Order['status']) => {
    switch (status) {
        case 'Delivered': return 'تم التوصيل';
        case 'Pending': return 'قيد الانتظار';
        case 'Shipped': return 'تم الشحن';
        case 'Cancelled': return 'ملغي';
        default: return status;
    }
};

const statusOptions: { [key in Order['status']]: string } = {
    'Pending': 'تحديد كـ قيد الانتظار',
    'Shipped': 'تحديد كـ تم الشحن',
    'Delivered': 'تحديد كـ تم التوصيل',
    'Cancelled': 'تحديد كـ ملغي',
}

export const getColumns = (
    handleStatusUpdate: (orderId: string, status: Order['status']) => void
): ColumnDef<Order>[] => [
    {
        accessorKey: "createdAt",
        header: "التاريخ",
        cell: ({ row }) => format(row.original.createdAt, "PP")
    },
    {
        accessorKey: "productName",
        header: "المنتج",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Image src={row.original.productImage} alt={row.original.productName} width={32} height={32} className="rounded-md" />
                <span className="font-medium">{row.original.productName}</span>
            </div>
        )
    },
    {
        accessorKey: "userName",
        header: "العميل",
        cell: ({ row }) => (
            <div>
                <div>{row.original.userName}</div>
                <div className="text-xs text-muted-foreground">{row.original.userEmail}</div>
            </div>
        )
    },
    {
        accessorKey: "deliveryPhoneNumber",
        header: "الهاتف"
    },
    {
        accessorKey: "price",
        header: "السعر",
        cell: ({ row }) => `$${row.original.price.toFixed(2)}`
    },
    {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{getStatusText(row.original.status)}</Badge>
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const order = row.original
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>تغيير الحالة</DropdownMenuLabel>
                        {(Object.keys(statusOptions) as Array<keyof typeof statusOptions>).map(status => (
                            <DropdownMenuItem key={status} onClick={() => handleStatusUpdate(order.id, status)} disabled={order.status === status}>
                                {statusOptions[status]}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
