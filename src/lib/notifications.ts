import type { MemoRequest, PurchaseOrder, ProcurementState, Role } from "@/lib/types";

export type NotificationTab = "memo" | "pr";
export type NotificationIconKey =
  | "revision"
  | "rejected"
  | "urgent"
  | "memo-approval"
  | "vendor-approval"
  | "vendor-proposal";

export interface ActionNotification {
  id: string;
  icon: NotificationIconKey;
  title: string;
  description: string;
  timeLabel: string;
  href: string;
  tab: NotificationTab;
  timestamp: string;
}

function getLatestTimestamp(...values: Array<string | undefined>) {
  return values.find((value) => Boolean(value)) ?? new Date(0).toISOString();
}

function formatRelativeTime(value: string) {
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) {
    return "-";
  }

  const diffMs = Date.now() - parsed;
  if (diffMs < 60 * 1000) {
    return "เมื่อสักครู่";
  }

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) {
    return `${diffMinutes} นาทีที่แล้ว`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ชม.ที่แล้ว`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} วันที่แล้ว`;
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function sortByLatest(items: ActionNotification[]) {
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getSourceMemo(po: PurchaseOrder, memos: MemoRequest[]) {
  return memos.find((memo) => memo.id === po.memoId) ?? null;
}

function getRequesterMemoHref(memo: MemoRequest) {
  return `/memo/${memo.id}/edit`;
}

function getApproverMemoHref(memo: MemoRequest) {
  return `/memo/${memo.id}/action`;
}

function getVendorActionHref(po: PurchaseOrder) {
  return `/pr-po/${po.id}/action`;
}

export function getActionNotifications(
  state: Pick<ProcurementState, "currentRole" | "currentUserId" | "memos" | "purchaseOrders">,
) {
  const { currentRole, currentUserId, memos, purchaseOrders } = state;

  if (!currentRole || !currentUserId) {
    return [] satisfies ActionNotification[];
  }

  const notifications: ActionNotification[] = [];

  if (currentRole === "Requester") {
    notifications.push(
      ...memos
        .filter((memo) => memo.requesterId === currentUserId && memo.status === "Revision Required")
        .map((memo) => ({
          id: `memo-revision-${memo.id}`,
          icon: "revision" as const,
          title: "Memo ขอแก้ไข",
          description: `${memo.documentNumber} • ${memo.title}`,
          timeLabel: formatRelativeTime(getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date)),
          href: getRequesterMemoHref(memo),
          tab: "memo" as const,
          timestamp: getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date),
        })),
    );

    notifications.push(
      ...memos
        .filter((memo) => memo.requesterId === currentUserId && memo.status === "Rejected")
        .map((memo) => ({
          id: `memo-rejected-${memo.id}`,
          icon: "rejected" as const,
          title: "Memo ถูกปฏิเสธ",
          description: `${memo.documentNumber} • ${memo.title}`,
          timeLabel: formatRelativeTime(getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date)),
          href: getRequesterMemoHref(memo),
          tab: "memo" as const,
          timestamp: getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date),
        })),
    );

    notifications.push(
      ...memos
        .filter(
          (memo) =>
            memo.requesterId === currentUserId &&
            (memo.urgency === "Urgent" || memo.urgency === "Emergency") &&
            ["Draft", "Revision Required", "Rejected"].includes(memo.status),
        )
        .map((memo) => ({
          id: `memo-urgent-${memo.id}`,
          icon: "urgent" as const,
          title: "รายการจัดซื้อเร่งด่วน",
          description: `${memo.documentNumber} • ${memo.title}`,
          timeLabel: formatRelativeTime(getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date)),
          href: getRequesterMemoHref(memo),
          tab: "memo" as const,
          timestamp: getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date),
        })),
    );
  }

  if (currentRole === "Approver") {
    notifications.push(
      ...memos
        .filter((memo) => memo.assignedApproverId === currentUserId && memo.status === "Pending Approval")
        .map((memo) => ({
          id: `memo-approval-${memo.id}`,
          icon: "memo-approval" as const,
          title: "รออนุมัติ Memo",
          description: `${memo.documentNumber} • ${memo.title}`,
          timeLabel: formatRelativeTime(getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date)),
          href: getApproverMemoHref(memo),
          tab: "memo" as const,
          timestamp: getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date),
        })),
    );

    notifications.push(
      ...purchaseOrders
        .filter((po) => {
          const sourceMemo = getSourceMemo(po, memos);
          return sourceMemo?.assignedApproverId === currentUserId && po.procurementStatus === "Pending Vendor Approval";
        })
        .map((po) => ({
          id: `vendor-approval-${po.id}`,
          icon: "vendor-approval" as const,
          title: "รออนุมัติการเลือก Vendor",
          description: `${po.prNumber ?? po.documentNumber} • ${po.memoTitle}`,
          timeLabel: formatRelativeTime(po.updatedAt),
          href: getVendorActionHref(po),
          tab: "pr" as const,
          timestamp: po.updatedAt,
        })),
    );
  }

  if (currentRole === "Purchasing") {
    notifications.push(
      ...purchaseOrders
        .filter((po) => po.procurementStatus === "Waiting for Purchasing to Propose Vendors")
        .map((po) => ({
          id: `vendor-proposal-${po.id}`,
          icon: "vendor-proposal" as const,
          title: "PR รอเสนอหรือคัดเลือก Vendor",
          description: `${po.prNumber ?? po.documentNumber} • ${po.memoTitle}`,
          timeLabel: formatRelativeTime(po.updatedAt),
          href: getVendorActionHref(po),
          tab: "pr" as const,
          timestamp: po.updatedAt,
        })),
    );
  }

  return sortByLatest(notifications);
}

export function getNotificationsForRole(
  role: Role | null | undefined,
  userId: string,
  memos: MemoRequest[],
  purchaseOrders: PurchaseOrder[],
) {
  return getActionNotifications({
    currentRole: role ?? "Requester",
    currentUserId: userId,
    memos,
    purchaseOrders,
  });
}
