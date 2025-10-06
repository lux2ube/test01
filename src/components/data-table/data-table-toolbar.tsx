"use client"

import type { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchPlaceholder?: string;
  filterableColumns?: {
    id: string
    title: string
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
  }[];
  children?: React.ReactNode | ((table: Table<TData>) => React.ReactNode)
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  filterableColumns = [],
  children,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
            placeholder={searchPlaceholder || "بحث في كل الأعمدة..."}
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
        />
        {typeof children === 'function' ? children(table) : children}
        {filterableColumns.map(
          (column) =>
            table.getColumn(column.id) && (
              <DataTableFacetedFilter
                key={column.id}
                column={table.getColumn(column.id)}
                title={column.title}
                options={column.options}
              />
            )
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
                table.resetColumnFilters()
                table.setGlobalFilter("")
            }}
            className="h-8 px-2 lg:px-3"
          >
            إعادة تعيين
            <X className="mr-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
