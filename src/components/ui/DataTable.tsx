import { ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  headerCellClassName?: string;
  bodyClassName?: string;
}

export function DataTable({
  headers,
  children,
  className = "",
  tableClassName = "",
  headerClassName = "",
  headerCellClassName = "",
  bodyClassName = "",
}: DataTableProps) {
  return (
    <div className={`overflow-x-auto rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] ${className}`}>
      <table className={`min-w-full border-separate border-spacing-0 text-left ${tableClassName}`}>
        <thead className={`sticky top-0 z-10 bg-[rgba(238,243,238,0.95)] text-sm tracking-normal text-slate-500 backdrop-blur ${headerClassName}`}>
          <tr>
            {headers.map((header) => (
              <th key={header} className={`border-b border-[var(--border)] px-5 py-4 font-semibold ${headerCellClassName}`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`text-sm text-slate-700 [&_tr:last-child_td]:border-b-0 [&_td]:border-b [&_td]:border-[rgba(24,58,43,0.06)] ${bodyClassName}`}>
          {children}
        </tbody>
      </table>
    </div>
  );
}
