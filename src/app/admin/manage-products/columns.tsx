"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Product, ProductCategory } from "@/types"

export const getColumns = (
  handleEdit: (product: Product) => void,
  handleDelete: (id: string) => void,
  categories: ProductCategory[]
): ColumnDef<Product>[] => [
  {
    accessorKey: "imageUrl",
    header: "الصورة",
    cell: ({ row }) => (
      <Image src={row.original.imageUrl} alt={row.original.name} width={40} height={40} className="rounded-md" data-ai-hint="product image" />
    ),
  },
  {
    accessorKey: "name",
    header: "الاسم",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "categoryName",
    header: "الفئة",
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "price",
    header: "السعر",
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: "stock",
    header: "المخزون",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
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
            <DropdownMenuItem onClick={() => handleEdit(product)}>
              تعديل
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive">
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
