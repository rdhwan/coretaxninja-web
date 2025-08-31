import React from "react";
import { useDataTable, type UseDataTableProps } from "~/hooks/use-data-table";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableSortList } from "~/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar";

type ControlledDataTableProps<TData> = Omit<
  React.ComponentProps<typeof DataTable>,
  "table"
> & {
  dt: UseDataTableProps<TData>;
};

export default function ControlledDataTable<TData>({
  dt,
  ...props
}: ControlledDataTableProps<TData>) {
  const { table } = useDataTable<TData>(dt);

  return (
    // With advanced toolbar
    <DataTable {...props} table={table}>
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}
