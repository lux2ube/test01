"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { FeedbackForm } from "@/types"
import Link from "next/link"

export const getColumns = (
    handleEdit: (form: FeedbackForm) => void,
    handleDelete: (id: string) => void
): ColumnDef<FeedbackForm>[] => [
    {
        accessorKey: "title",
        header: "العنوان",
        cell: ({ row }) => <div className="font-medium">{row.original.title}</div>
    },
    {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
            const status = row.original.status;
            return <span className={`px-2 py-1 rounded-full text-xs ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{status === 'active' ? 'نشط' : 'غير نشط'}</span>
        }
    },
    {
        accessorKey: "responseCount",
        header: "الاستجابات",
        cell: ({ row }) => {
            const form = row.original;
            return (
                 <Link href={`/admin/manage-feedback/${form.id}`} className="hover:underline text-primary">
                    {form.responseCount || 0}
                </Link>
            )
        }
    },
    {
        accessorKey: "createdAt",
        header: "تاريخ الإنشاء",
        cell: ({ row }) => format(row.original.createdAt, "PP")
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const form = row.original
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(form)}>
                            تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link href={`/admin/manage-feedback/${form.id}`} className="w-full text-right">
                                عرض الاستجابات
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(form.id)} className="text-destructive">
                            حذف
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
];
