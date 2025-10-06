"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"

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
import type { PaymentMethod } from "@/types"
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export const getColumns = (
  handleEdit: (method: PaymentMethod) => void,
  handleDeleteRequest: (id: string) => void
): ColumnDef<PaymentMethod>[] => [
  {
    accessorKey: "name",
    header: "الاسم",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "type",
    header: "النوع",
    cell: ({ row }) => <Badge variant="outline">{row.original.type.replace('_', ' ')}</Badge>,
  },
  {
    accessorKey: "isEnabled",
    header: "الحالة",
    cell: ({ row }) => (
      <Badge variant={row.original.isEnabled ? 'default' : 'secondary'}>
        {row.original.isEnabled ? 'مفعل' : 'معطل'}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const method = row.original

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
            <DropdownMenuItem onClick={() => handleEdit(method)}>
              <Edit className="mr-2 h-4 w-4" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuItem
                onSelect={(e) => {
                    e.preventDefault();
                    handleDeleteRequest(method.id);
                }}
                className="text-destructive"
            >
                <Trash2 className="mr-2 h-4 w-4" />
                حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
