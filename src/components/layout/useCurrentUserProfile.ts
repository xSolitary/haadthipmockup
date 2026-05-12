"use client";

import { useRouter } from "next/navigation";
import { getRoleLabel } from "@/lib/ui-text";
import { useProcurementStore } from "@/store/useProcurementStore";

function getInitials(name?: string) {
  if (!name) {
    return "HT";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function useCurrentUserProfile() {
  const router = useRouter();
  const currentRole = useProcurementStore((state) => state.currentRole);
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const currentUsername = useProcurementStore((state) => state.currentUsername);
  const users = useProcurementStore((state) => state.users);
  const logout = useProcurementStore((state) => state.logout);

  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0];
  const roleLabel = currentRole ? getRoleLabel(currentRole) : "-";

  const handleLogout = () => {
    logout();

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ht-procurement-store");
    }

    router.replace("/login");
  };

  return {
    currentUser,
    currentUsername,
    initials: getInitials(currentUser?.name),
    roleLabel,
    handleLogout,
  };
}
