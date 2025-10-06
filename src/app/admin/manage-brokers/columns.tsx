"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { MoreHorizontal, Star } from "lucide-react"

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
import type { Broker } from "@/types"
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export const getColumns = (
  handleEdit: (broker: Broker) => void,
  handleDelete: (id: string) => void
): ColumnDef<Broker>[] => [
  {
    accessorKey: "logoUrl",
    header: "الشعار",
    cell: ({ row }) => (
      <Image
        src={row.original.logoUrl}
        alt={`${row.original.basicInfo?.broker_name} logo`}
        width={32}
        height={32}
        className="rounded-md border p-0.5 bg-white"
        data-ai-hint="logo"
      />
    ),
  },
  {
    accessorKey: "basicInfo.broker_name",
    header: "الاسم",
    cell: ({ row }) => <div className="font-medium">{row.original.basicInfo?.broker_name || row.original.name}</div>,
  },
  {
    accessorKey: "regulation.risk_level",
    header: "مستوى المخاطرة",
    cell: ({ row }) => {
      const riskLevel = row.original.regulation?.risk_level;
      return riskLevel ? <Badge variant="outline" className="capitalize">{riskLevel}</Badge> : 'N/A';
    },
  },
  {
    accessorKey: "reputation.wikifx_score",
    header: "تقييم WikiFX",
    cell: ({ row }) => {
      const score = row.original.reputation?.wikifx_score;
      return (
        <div className="flex items-center gap-1">
          {score ?? 'N/A'} <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const broker = row.original;
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
            <DropdownMenuItem onClick={() => handleEdit(broker)}>
              تعديل
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    حذف
                </DropdownMenuItem>
              </AlertDialogTrigger>
              {/* The content for this dialog is in the parent page */}
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
