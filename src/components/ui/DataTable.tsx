import { ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  children: ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-100">
      <table className="min-w-full border-separate border-spacing-0 text-left">
        <thead className="bg-slate-50 text-sm tracking-normal text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-4 font-semibold">
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
