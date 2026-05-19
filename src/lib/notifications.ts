import type { MemoRequest, PaymentRequest, ProcurementState, PurchaseOrder, Role } from "@/lib/types";

export type NotificationTab = "memo" | "pr" | "po" | "payment";
export type NotificationIconKey =
  | "revision"
  | "rejected"
  | "urgent"
  | "memo-approval"
  | "vendor-approval"
  | "vendor-proposal"
  | "delivery-update"
  | "delivery-arrived";

export type NotificationRelatedType = "memo" | "purchase-order" | "payment-request";

export interface ActionNotification {
  id: string;
  icon: NotificationIconKey;
  title: string;
  description: string;
  timeLabel: string;
  href: string;
  tab: NotificationTab;
  timestamp: string;
  relatedId: string;
  relatedType: NotificationRelatedType;
  completed: boolean;
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

function getVendorSelectionHref(po: PurchaseOrder) {
  return `/pr-po/${po.id}/action`;
}

function getVendorPoHref(po: PurchaseOrder) {
  return `/pr-po/${po.id}/action`;
}

function getPoListHref() {
  return "/my-requests?tab=po";
}

function getReceivingHref() {
  return "/receiving";
}

function getPaymentHref() {
  return "/payment";
}

function isReceivingActionOpen(po: PurchaseOrder) {
  return ["PO Created", "Sent to Vendor", "Pending Receiving", "Received"].includes(po.procurementStatus);
}

function createNotification(notification: Omit<ActionNotification, "completed">): ActionNotification {
  return {
    ...notification,
    completed: false,
  };
}

export function getActionNotifications(
  state: Pick<
    ProcurementState,
    "currentRole" | "currentUserId" | "memos" | "purchaseOrders" | "paymentRequests"
  >,
) {
  const { currentRole, currentUserId, memos, purchaseOrders, paymentRequests } = state;

  if (!currentRole || !currentUserId) {
    return [] satisfies ActionNotification[];
  }

  const notifications: ActionNotification[] = [];

  if (currentRole === "Requester") {
    notifications.push(
      ...memos
        .filter((memo) => memo.requesterId === currentUserId && memo.status === "Revision Required")
        .map((memo) =>
          createNotification({
            id: `memo-revision-${memo.id}`,
            icon: "revision",
            title: "Memo ขอแก้ไข",
            description: `${memo.documentNumber} • ${memo.title}`,
            timeLabel: formatRelativeTime(getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date)),
            href: getRequesterMemoHref(memo),
            tab: "memo",
            timestamp: getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date),
            relatedId: memo.id,
            relatedType: "memo",
          }),
        ),
    );

    notifications.push(
      ...memos
        .filter((memo) => memo.requesterId === currentUserId && memo.status === "Rejected")
        .map((memo) =>
          createNotification({
            id: `memo-rejected-${memo.id}`,
            icon: "rejected",
            title: "Memo ถูกปฏิเสธ",
            description: `${memo.documentNumber} • ${memo.title}`,
            timeLabel: formatRelativeTime(getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date)),
            href: getRequesterMemoHref(memo),
            tab: "memo",
            timestamp: getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date),
            relatedId: memo.id,
            relatedType: "memo",
          }),
        ),
    );

    notifications.push(
      ...memos
        .filter(
          (memo) =>
            memo.requesterId === currentUserId &&
            (memo.urgency === "Urgent" || memo.urgency === "Emergency") &&
            ["Draft", "Revision Required", "Rejected"].includes(memo.status),
        )
        .map((memo) =>
          createNotification({
            id: `memo-urgent-${memo.id}`,
            icon: "urgent",
            title: "รายการจัดซื้อเร่งด่วน",
            description: `${memo.documentNumber} • ${memo.title}`,
            timeLabel: formatRelativeTime(getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date)),
            href: getRequesterMemoHref(memo),
            tab: "memo",
            timestamp: getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date),
            relatedId: memo.id,
            relatedType: "memo",
          }),
        ),
    );
  }

  if (currentRole === "Approver") {
    notifications.push(
      ...memos
        .filter((memo) => memo.assignedApproverId === currentUserId && memo.status === "Pending Approval")
        .map((memo) =>
          createNotification({
            id: `memo-approval-${memo.id}`,
            icon: "memo-approval",
            title: "รออนุมัติ Memo",
            description: `${memo.documentNumber} • ${memo.title}`,
            timeLabel: formatRelativeTime(getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date)),
            href: getApproverMemoHref(memo),
            tab: "memo",
            timestamp: getLatestTimestamp(memo.updatedAt, memo.history.at(-1)?.date),
            relatedId: memo.id,
            relatedType: "memo",
          }),
        ),
    );

    notifications.push(
      ...purchaseOrders
        .filter((po) => {
          const sourceMemo = getSourceMemo(po, memos);
          return sourceMemo?.assignedApproverId === currentUserId && po.procurementStatus === "Pending Vendor Approval";
        })
        .map((po) =>
          createNotification({
            id: `vendor-approval-${po.id}`,
            icon: "vendor-approval",
            title: "รออนุมัติการเลือก Vendor",
            description: `${po.prNumber ?? po.documentNumber} • ${po.memoTitle}`,
            timeLabel: formatRelativeTime(po.updatedAt),
            href: getVendorSelectionHref(po),
            tab: "pr",
            timestamp: po.updatedAt,
            relatedId: po.id,
            relatedType: "purchase-order",
          }),
        ),
    );

    notifications.push(
      ...purchaseOrders
        .filter((po) => {
          const sourceMemo = getSourceMemo(po, memos);
          return (
            sourceMemo?.assignedApproverId === currentUserId &&
            Boolean(po.vendorUpdatedAt) &&
            isReceivingActionOpen(po)
          );
        })
        .map((po) =>
          createNotification({
            id: `vendor-status-approver-${po.id}`,
            icon: po.vendorDeliveryStatus === "จัดส่งถึงปลายทางแล้ว" ? "delivery-arrived" : "delivery-update",
            title:
              po.vendorDeliveryStatus === "จัดส่งถึงปลายทางแล้ว"
                ? "สินค้าถึงปลายทางแล้ว"
                : "ร้านค้าอัปเดตสถานะจัดส่งของ PO ที่อนุมัติ",
            description: `${po.poNumber ?? po.documentNumber} • ${po.vendorDeliveryStatus ?? "-"}`,
            timeLabel: formatRelativeTime(po.vendorUpdatedAt ?? po.updatedAt),
            href: po.vendorDeliveryStatus === "จัดส่งถึงปลายทางแล้ว" ? getReceivingHref() : getPoListHref(),
            tab: "po",
            timestamp: po.vendorUpdatedAt ?? po.updatedAt,
            relatedId: po.id,
            relatedType: "purchase-order",
          }),
        ),
    );
  }

  if (currentRole === "Purchasing") {
    notifications.push(
      ...purchaseOrders
        .filter((po) => po.procurementStatus === "Waiting for Purchasing to Propose Vendors")
        .map((po) =>
          createNotification({
            id: `vendor-proposal-${po.id}`,
            icon: "vendor-proposal",
            title: "PR รอเสนอหรือคัดเลือก Vendor",
            description: `${po.prNumber ?? po.documentNumber} • ${po.memoTitle}`,
            timeLabel: formatRelativeTime(po.updatedAt),
            href: getVendorSelectionHref(po),
            tab: "pr",
            timestamp: po.updatedAt,
            relatedId: po.id,
            relatedType: "purchase-order",
          }),
        ),
    );

    notifications.push(
      ...purchaseOrders
        .filter((po) => Boolean(po.vendorUpdatedAt) && isReceivingActionOpen(po))
        .map((po) =>
          createNotification({
            id: `vendor-status-purchasing-${po.id}`,
            icon: po.vendorDeliveryStatus === "จัดส่งถึงปลายทางแล้ว" ? "delivery-arrived" : "delivery-update",
            title:
              po.vendorDeliveryStatus === "จัดส่งถึงปลายทางแล้ว"
                ? "สินค้าถึงปลายทาง รอตรวจรับ"
                : "ร้านค้าอัปเดตสถานะจัดส่ง",
            description: `${po.poNumber ?? po.documentNumber} • ${po.vendorDeliveryStatus ?? "-"}`,
            timeLabel: formatRelativeTime(po.vendorUpdatedAt ?? po.updatedAt),
            href: po.vendorDeliveryStatus === "จัดส่งถึงปลายทางแล้ว" ? getReceivingHref() : getPoListHref(),
            tab: "po",
            timestamp: po.vendorUpdatedAt ?? po.updatedAt,
            relatedId: po.id,
            relatedType: "purchase-order",
          }),
        ),
    );
  }

  if (currentRole === "Vendor") {
    notifications.push(
      ...purchaseOrders
        .filter((po) => Boolean(po.selectedVendorName) && !po.vendorDeliveryStatus)
        .map((po) =>
          createNotification({
            id: `vendor-new-po-${po.id}`,
            icon: "vendor-proposal",
            title: "PO ใหม่ที่ต้องดำเนินการจัดส่ง",
            description: `${po.poNumber ?? po.documentNumber} • ${po.memoTitle}`,
            timeLabel: formatRelativeTime(po.updatedAt),
            href: getVendorPoHref(po),
            tab: "po",
            timestamp: po.updatedAt,
            relatedId: po.id,
            relatedType: "purchase-order",
          }),
        ),
    );

    notifications.push(
      ...purchaseOrders
        .filter((po) => Boolean(po.selectedVendorName) && po.vendorDeliveryStatus !== "จัดส่งถึงปลายทางแล้ว")
        .map((po) =>
          createNotification({
            id: `vendor-followup-${po.id}`,
            icon: "delivery-update",
            title: "PO ที่ต้องอัปเดตสถานะ",
            description: `${po.poNumber ?? po.documentNumber} • ${po.vendorDeliveryStatus ?? "ยังไม่อัปเดต"}`,
            timeLabel: formatRelativeTime(po.vendorUpdatedAt ?? po.updatedAt),
            href: getVendorPoHref(po),
            tab: "po",
            timestamp: po.vendorUpdatedAt ?? po.updatedAt,
            relatedId: po.id,
            relatedType: "purchase-order",
          }),
        ),
    );
  }

  if (currentRole === "Finance") {
    notifications.push(
      ...paymentRequests
        .filter((payment) => payment.status !== "Paid")
        .map((payment) =>
          createNotification({
            id: `payment-${payment.id}`,
            icon: "memo-approval",
            title: "รอดำเนินการจ่ายเงิน",
            description: `${payment.poNumber} • ${payment.vendorName}`,
            timeLabel: formatRelativeTime(payment.createdAt),
            href: getPaymentHref(),
            tab: "payment",
            timestamp: payment.createdAt,
            relatedId: payment.id,
            relatedType: "payment-request",
          }),
        ),
    );
  }

  return sortByLatest(notifications);
}

export function getNotificationsForRole(
  role: Role | null | undefined,
  userId: string,
  memos: MemoRequest[],
  purchaseOrders: PurchaseOrder[],
  paymentRequests: PaymentRequest[] = [],
) {
  return getActionNotifications({
    currentRole: role ?? "Requester",
    currentUserId: userId,
    memos,
    purchaseOrders,
    paymentRequests,
  });
}
