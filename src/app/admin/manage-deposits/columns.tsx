"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { ChevronDown, User, DollarSign, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AdminDeposit } from "./actions"

export const columns: ColumnDef<AdminDeposit>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={row.getToggleExpandedHandler()}
          disabled={!row.getCanExpand()}
          className="h-6 w-6"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${row.getIsExpanded() ? 'rotate-180' : ''}`} />
        </Button>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "التاريخ",
    cell: ({ row }) => (
      <div className="text-sm">
        <div>{format(new Date(row.original.createdAt), 'PP', { locale: ar })}</div>
        <div className="text-xs text-muted-foreground">{format(new Date(row.original.createdAt), 'p', { locale: ar })}</div>
      </div>
    ),
  },
  {
    id: 'user',
    accessorKey: "userName",
    header: "المستخدم",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="font-medium text-sm">{row.original.userName}</div>
          <div className="text-xs text-muted-foreground">{row.original.userEmail}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "المبلغ",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <DollarSign className="h-4 w-4 text-green-600" />
        <span className="font-semibold text-green-600">${row.original.amount.toFixed(2)}</span>
      </div>
    ),
  },
  {
    accessorKey: "reason",
    header: "السبب",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.original.reason}>
        {row.original.reason || 'إيداع إداري'}
      </div>
    ),
  },
  {
    id: 'admin',
    accessorKey: "adminName",
    header: "المدير",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          {row.original.adminName || 'مدير'}
        </Badge>
      </div>
    ),
  },
]
