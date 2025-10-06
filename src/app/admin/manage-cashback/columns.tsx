"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import type { CashbackTransaction } from "@/types"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import Link from "next/link"

export const columns: ColumnDef<CashbackTransaction>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التاريخ" />
    ),
    cell: ({ row }) => format(row.original.date, "PP"),
  },
  {
    accessorKey: "userProfile.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المستخدم" />
    ),
    cell: ({ row }) => {
        const userId = row.original.userId;
        const userName = (row.original as any).userProfile?.name || "مستخدم غير معروف";
        return <Link href={`/admin/users/${userId}`} className="hover:underline font-medium">{userName}</Link>
    }
  },
  {
    accessorKey: "broker",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الوسيط" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "accountNumber",
    header: "رقم الحساب",
  },
  {
    accessorKey: "tradeDetails",
    header: "التفاصيل",
  },
  {
    accessorKey: "cashbackAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المبلغ" />
    ),
    cell: ({ row }) => (
      <div className="font-semibold text-primary">${row.original.cashbackAmount.toFixed(2)}</div>
    ),
  },
]
