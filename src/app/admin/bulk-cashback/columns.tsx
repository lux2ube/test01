
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { CashbackTransaction } from "@/types"

type BulkCashbackRow = CashbackTransaction & { status: string; reason?: string, originalRow: number };

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Accepted': return 'default'
    case 'Rejected': return 'destructive'
    default: return 'secondary'
  }
}

export const columns: ColumnDef<BulkCashbackRow>[] = [
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
        disabled={row.original.status !== 'Accepted'}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "accountNumber",
    header: "رقم الحساب",
  },
  {
    accessorKey: "cashbackAmount",
    header: "المبلغ",
    cell: ({ row }) => `$${row.original.cashbackAmount.toFixed(2)}`,
  },
  {
    accessorKey: "note",
    header: "ملاحظة",
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
    ),
  },
  {
    accessorKey: "reason",
    header: "السبب",
  },
]
