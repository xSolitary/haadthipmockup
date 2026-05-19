"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface PageHeaderValue {
  pathname: string;
  badge?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  topbarControls?: ReactNode;
}

interface PageHeaderContextValue {
  pageHeader: PageHeaderValue | null;
  setPageHeader: Dispatch<SetStateAction<PageHeaderValue | null>>;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [pageHeader, setPageHeader] = useState<PageHeaderValue | null>(null);
  const value = useMemo(() => ({ pageHeader, setPageHeader }), [pageHeader]);

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeaderContext() {
  const context = useContext(PageHeaderContext);

  if (!context) {
    throw new Error("usePageHeaderContext must be used within PageHeaderProvider");
  }

  return context;
}
