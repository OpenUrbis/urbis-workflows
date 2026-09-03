import React from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  title,
  emptyMessage = "Nenhum dado encontrado",
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
      )}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-center text-muted-foreground text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, ri) => (
                <tr key={ri} className="hover:bg-muted/30 transition-colors">
                  {columns.map((col, ci) => (
                    <td key={ci} className={`px-3 py-2 ${col.className || ""}`}>
                      {typeof col.accessor === "function"
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
