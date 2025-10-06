
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from 'date-fns'
import Link from 'next/link'
import { MoreHorizontal, FileText, Home, Phone, User, Check, X, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { PendingVerification, KycData, AddressData } from "@/types"

function VerificationDataCell({ data }: { data: KycData | AddressData | { phoneNumber: string } }) {
    return (
        <div className="text-xs space-y-1">
            {Object.entries(data).map(([key, value]) => {
                if (key === 'status' || key === 'rejectionReason' || key === 'submittedAt') return null;
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return <p key={key}><span className="font-semibold">{formattedKey}:</span> {String(value)}</p>;
            })}
        </div>
    );
}

const getTypeInfo = (type: PendingVerification['type']) => {
    switch (type) {
        case 'KYC': return { icon: FileText, text: 'تحقق الهوية' };
        case 'Address': return { icon: Home, text: 'تحقق العنوان' };
        case 'Phone': return { icon: Phone, text: 'تحقق الهاتف' };
        default: return { icon: User, text: 'تحقق' };
    }
};

export const getColumns = (
  handleApprove: (userId: string, type: PendingVerification['type']) => void,
  handleRejectRequest: (userId: string, type: PendingVerification['type']) => void,
  handleViewDocuments: (request: PendingVerification) => void
): ColumnDef<PendingVerification>[] => [
  {
    accessorKey: 'userName',
    header: 'المستخدم',
    cell: ({ row }) => (
      <div>
        <Link href={`/admin/users/${row.original.userId}`} className="font-medium hover:underline">{row.original.userName}</Link>
        <p className="text-xs text-muted-foreground">{row.original.userEmail}</p>
      </div>
    )
  },
  {
    accessorKey: 'type',
    header: 'النوع',
    cell: ({ row }) => {
      const { icon: Icon, text } = getTypeInfo(row.original.type);
      return (
        <Badge variant="secondary" className="gap-2">
          <Icon className="h-4 w-4" /> {text}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'data',
    header: 'البيانات المقدمة',
    cell: ({ row }) => <VerificationDataCell data={row.original.data} />
  },
  {
    accessorKey: 'requestedAt',
    header: 'تاريخ الطلب',
    cell: ({ row }) => format(row.original.requestedAt, 'PP')
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const request = row.original;
      const canViewDocuments = request.type === 'KYC' || request.type === 'Address';
      
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
            {canViewDocuments && (
              <>
                <DropdownMenuItem onClick={() => handleViewDocuments(request)}>
                  <Eye className="mr-2 h-4 w-4" />
                  عرض المستندات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => handleApprove(request.userId, request.type)}>
              <Check className="mr-2 h-4 w-4" />
              موافقة
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleRejectRequest(request.userId, request.type); }} className="text-destructive">
                <X className="mr-2 h-4 w-4" />
                رفض
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
