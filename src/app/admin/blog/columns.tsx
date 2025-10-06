"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"

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
import { format } from "date-fns"

export const getColumns = (
  handleEdit: (post: BlogPost) => void,
  handleDelete: (id: string) => void
): ColumnDef<BlogPost>[] => [
  {
    accessorKey: "title",
    header: "العنوان",
    cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
  },
  {
    accessorKey: "isPublished",
    header: "الحالة",
    cell: ({ row }) => {
      const isPublished = row.original.isPublished
      return (
        <Badge variant={isPublished ? 'default' : 'secondary'}>
          {isPublished ? 'منشور' : 'مسودة'}
        </Badge>
      )
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          آخر تحديث
          <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => format(row.original.updatedAt, "PP"),
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
            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleEdit(post)}>
              تعديل المقال
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive">
              حذف المقال
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
