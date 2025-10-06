"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { format } from 'date-fns'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { BlogPost } from "@/types"

const getStatusVariant = (status: BlogPost['status']) => {
    return status === 'published' ? 'default' : 'secondary';
};

const getStatusText = (status: BlogPost['status']) => {
    return status === 'published' ? 'منشور' : 'مسودة';
};

export const getColumns = (
    handleEdit: (post: BlogPost) => void,
    handleDelete: (id: string) => void
): ColumnDef<BlogPost>[] => [
    {
        accessorKey: "title",
        header: "العنوان",
        cell: ({ row }) => (
            <div className="max-w-md">
                <div className="font-medium">{row.original.title}</div>
                <div className="text-xs text-muted-foreground truncate">{row.original.excerpt}</div>
            </div>
        )
    },
    {
        accessorKey: "authorName",
        header: "المؤلف",
    },
    {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{getStatusText(row.original.status)}</Badge>
    },
    {
        accessorKey: "tags",
        header: "الوسوم",
        cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
                {row.original.tags?.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
                {row.original.tags && row.original.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">+{row.original.tags.length - 2}</Badge>
                )}
            </div>
        )
    },
    {
        accessorKey: "createdAt",
        header: "تاريخ الإنشاء",
        cell: ({ row }) => format(row.original.createdAt, "PP")
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const post = row.original
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(post)}>
                            <Pencil className="ml-2 h-4 w-4" />
                            تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive">
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
