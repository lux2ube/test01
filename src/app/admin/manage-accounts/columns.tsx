"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { TradingAccount } from "@/types"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
}
    
const getStatusText = (status: string) => {
    switch (status) {
        case 'Approved': return 'مقبول';
        case 'Pending': return 'معلق';
        case 'Rejected': return 'مرفوض';
        default: return status;
    }
}

export const columns: ColumnDef<TradingAccount>[] = [
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
  },
  {
    accessorKey: "userId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="معرف المستخدم" />,
    cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground truncate" style={{ maxWidth: '100px' }}>{row.original.userId}</div>,
  },
  {
    accessorKey: "broker",
    header: ({ column }) => <DataTableColumnHeader column={column} title="الوسيط" />,
  },
  {
    accessorKey: "accountNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="رقم الحساب" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="الحالة" />,
    cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>{getStatusText(row.original.status)}</Badge>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "rejectionReason",
    header: "السبب",
    cell: ({ row }) => <div className="text-xs text-muted-foreground max-w-[200px] truncate">{row.original.rejectionReason}</div>,
  },
];
