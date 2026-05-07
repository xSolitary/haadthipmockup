import { ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
  tableClassName?: string;
}

export function DataTable({ headers, children, className = "", tableClassName = "" }: DataTableProps) {
  return (
    <div className={`overflow-x-auto rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/50 ${className}`}>
      <table className={`min-w-full border-separate border-spacing-0 text-left ${tableClassName}`}>
        <thead className="sticky top-0 z-10 bg-slate-50/95 text-sm tracking-normal text-slate-500 backdrop-blur">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-slate-200 px-5 py-4 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm text-slate-700">{children}</tbody>
      </table>
    </div>
  );
}
