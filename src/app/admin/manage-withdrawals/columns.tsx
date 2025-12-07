"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Withdrawal, UserProfile } from "@/types"
import { Copy, ChevronDown, AlertTriangle, ShieldCheck, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

type EnrichedWithdrawal = Withdrawal & { userProfile?: UserProfile };

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Completed': return 'default';
        case 'Processing': return 'secondary';
        case 'Failed': return 'destructive';
        default: return 'outline';
    }
}
    
const getStatusText = (status: string) => {
    switch (status) {
        case 'Completed': return 'مكتمل';
        case 'Processing': return 'قيد المعالجة';
        case 'Failed': return 'فشل';
        default: return status;
    }
}

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};


export const columns: ColumnDef<EnrichedWithdrawal>[] = [
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
    accessorKey: "requestedAt",
    header: "التاريخ",
    cell: ({ row }) => format(new Date(row.original.requestedAt), 'PP'),
  },
  {
    id: 'user',
    accessorKey: "userProfile.name",
    header: "المستخدم",
    cell: ({ row }) => (
        <div>
            <div className="font-medium text-sm">{row.original.userProfile?.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{row.original.userProfile?.clientId}</div>
        </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "المبلغ",
    cell: ({ row }) => <div className="font-medium">${row.original.amount.toFixed(2)}</div>
  },
  {
    accessorKey: "paymentMethod",
    header: "الطريقة",
    cell: ({ row }) => {
      const isAdminAdjustment = row.original.withdrawalDetails?.type === 'admin_adjustment';
      return (
        <div className="flex items-center gap-1.5">
          {isAdminAdjustment ? (
            <Badge variant="secondary" className="gap-1">
              <Settings className="h-3 w-3" />
              تعديل إداري
            </Badge>
          ) : (
            <Badge variant="outline">{row.original.paymentMethod}</Badge>
          )}
          {!isAdminAdjustment && row.original.status === 'Processing' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {row.original.isWhitelisted ? (
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{row.original.isWhitelisted ? 'عنوان موثق' : 'عنوان جديد - يحتاج مراجعة'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{getStatusText(row.original.status)}</Badge>,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
];
