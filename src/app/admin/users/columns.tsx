
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, User, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { UserProfile } from "@/types"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

const getStatusVariant = (status?: string) => {
    switch (status) {
        case 'Trader': return 'default';
        case 'Active': return 'outline';
        case 'NEW': return 'secondary';
        default: return 'secondary';
    }
}

export const getColumns = (levelMap: Map<number, string>): ColumnDef<UserProfile>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "clientId",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            ID <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("clientId")}</div>,
  },
  {
    accessorKey: "name",
    header: "الاسم",
    cell: ({ row }) => {
        const router = useRouter();
        return (
            <div 
                className="font-medium cursor-pointer hover:underline"
                onClick={() => router.push(`/admin/users/${row.original.id}`)}
            >
                {row.getValue("name")}
            </div>
        )
    }
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          البريد الإلكتروني <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
    ),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.getValue("status"))}>{row.getValue("status")}</Badge>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "level",
    header: "المستوى",
    cell: ({ row }) => {
      const levelId = row.getValue("level") as number;
      return levelMap.get(levelId) || 'N/A';
    },
    filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
  },
  {
    accessorKey: "createdAt",
    header: "تاريخ الانضمام",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date | undefined;
      return date ? format(date, "PP") : "-"
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
      const router = useRouter();

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
              نسخ معرف المستخدم
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                <User className="ml-2 h-4 w-4" />
                عرض التفاصيل
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => router.push(`/admin/manage-verifications?userId=${user.id}`)}>
                <ShieldAlert className="ml-2 h-4 w-4" />
                مراجعة التحقق
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
