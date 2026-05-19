"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePageHeaderContext } from "@/components/layout/PageHeaderContext";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  topbarControls?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge = "ระบบงาน",
  actions,
  topbarControls,
}: PageHeaderProps) {
  const pathname = usePathname();
  const { setPageHeader } = usePageHeaderContext();

  useEffect(() => {
    setPageHeader({ pathname, badge, title, subtitle, actions, topbarControls });

    return () => {
      setPageHeader((current) => (current?.pathname === pathname ? null : current));
    };
  }, [actions, badge, pathname, setPageHeader, subtitle, title, topbarControls]);

  return null;
}
