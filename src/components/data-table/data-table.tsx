
"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type FilterFn,
  type ExpandedState,
  type Row,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string;
  filterableColumns?: {
    id: string
    title: string
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
  }[],
  globalFilterFn?: FilterFn<TData>
  children?: React.ReactNode | ((table: ReturnType<typeof useReactTable<TData>>) => React.ReactNode)
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  onRowSelectionChange?: React.Dispatch<React.SetStateAction<{}>>;
  state?: { rowSelection?: {} };
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder,
  filterableColumns,
  globalFilterFn,
  children,
  renderSubComponent,
  getRowCanExpand,
  onRowSelectionChange,
  state: controlledState,
  enableRowSelection = true,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  const state = controlledState ?? {
    sorting,
    columnVisibility,
    rowSelection,
    columnFilters,
    globalFilter,
    expanded,
  };
  
  const handleRowSelectionChange = onRowSelectionChange ?? setRowSelection;

  const table = useReactTable({
    data,
    columns,
    state: state,
    globalFilterFn: globalFilterFn,
    enableRowSelection: enableRowSelection,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getRowCanExpand,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>كل السجلات</CardTitle>
        <CardDescription>
            تم العثور على {table.getFilteredRowModel().rows.length} من {data.length} سجل.
        </CardDescription>
         <DataTableToolbar 
            table={table}
            searchPlaceholder={searchPlaceholder}
            filterableColumns={filterableColumns}
        >
            {typeof children === 'function' ? children(table) : children}
        </DataTableToolbar>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && renderSubComponent && (
                        <TableRow>
                            <TableCell colSpan={columns.length}>
                                {renderSubComponent({ row })}
                            </TableCell>
                        </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    لا توجد نتائج.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  )
}
