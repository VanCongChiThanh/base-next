import { Notification, NotificationType, ReferenceType } from "@/types";

/**
 * Template cho notification - FE tự định nghĩa title/message
 * Dễ dàng hỗ trợ i18n: chỉ cần thay đổi templates theo locale
 */
interface NotificationTemplate {
  title: string;
  message: string; // Dùng {key} để replace với data
}

/**
 * Notification templates - Tiếng Việt
 * TODO: Khi cần i18n, load templates từ file JSON theo locale
 */
const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  // System
  [NotificationType.SYSTEM]: {
    title: "Thông báo hệ thống",
    message: "{content}",
  },

  // Order
  [NotificationType.ORDER_CREATED]: {
    title: "Đơn hàng mới",
    message: "Đơn hàng {orderCode} đã được tạo thành công",
  },
  [NotificationType.ORDER_CONFIRMED]: {
    title: "Đơn hàng đã xác nhận",
    message: "Đơn hàng {orderCode} đã được xác nhận",
  },
  [NotificationType.ORDER_SHIPPED]: {
    title: "Đơn hàng đang giao",
    message: "Đơn hàng {orderCode} đang được vận chuyển",
  },
  [NotificationType.ORDER_DELIVERED]: {
    title: "Giao hàng thành công",
    message: "Đơn hàng {orderCode} đã được giao thành công",
  },
  [NotificationType.ORDER_CANCELLED]: {
    title: "Đơn hàng đã hủy",
    message: "Đơn hàng {orderCode} đã bị hủy",
  },

  // Payment
  [NotificationType.PAYMENT_SUCCESS]: {
    title: "Thanh toán thành công",
    message: "Thanh toán {amount} thành công",
  },
  [NotificationType.PAYMENT_FAILED]: {
    title: "Thanh toán thất bại",
    message: "Thanh toán thất bại: {reason}",
  },

  // Social
  [NotificationType.USER_FOLLOWED]: {
    title: "Người theo dõi mới",
    message: "{userName} đã theo dõi bạn",
  },
  [NotificationType.POST_LIKED]: {
    title: "Lượt thích mới",
    message: "{userName} đã thích bài viết của bạn",
  },
  [NotificationType.POST_COMMENTED]: {
    title: "Bình luận mới",
    message: '{userName} đã bình luận: "{comment}"',
  },
  [NotificationType.COMMENT_REPLIED]: {
    title: "Phản hồi mới",
    message: '{userName} đã phản hồi: "{reply}"',
  },

  // Promotion
  [NotificationType.PROMOTION]: {
    title: "{promoTitle}",
    message: "{promoMessage}",
  },

  // Gig Platform / Jobs
  [NotificationType.JOB_APPLICATION_RECEIVED]: {
    title: "Ứng viên mới",
    message:
      "Bạn có ứng viên mới ứng tuyển vào công việc: {jobTitle}. {message}",
  },
  [NotificationType.JOB_APPLICATION_ACCEPTED]: {
    title: "Ứng tuyển thành công",
    message:
      "Hồ sơ của bạn cho công việc {jobTitle} đã được chấp nhận. {message}",
  },
  [NotificationType.JOB_APPLICATION_REJECTED]: {
    title: "Ứng tuyển bị từ chối",
    message: "Trạng thái công việc {jobTitle}: {message}",
  },
  [NotificationType.JOB_COMPLETED]: {
    title: "Công việc hoàn thành",
    message: "Công việc {jobTitle} đã kết thúc.",
  },
  [NotificationType.JOB_CANCELLED]: {
    title: "Công việc bị hủy",
    message: "Công việc {jobTitle} đã bị hủy bỏ.",
  },
  [NotificationType.JOB_CHECKED_IN]: {
    title: "Ứng viên đã Điểm danh",
    message: "Ứng viên đã đến làm việc tại {jobTitle}.",
  },
  [NotificationType.APPLICATION_CANCELLED]: {
    title: "Ứng viên hủy ứng tuyển",
    message: "Một ứng viên đã rút lại hồ sơ cho công việc {jobTitle}.",
  },
  [NotificationType.REVIEW_RECEIVED]: {
    title: "Đánh giá mới",
    message: "Bạn nhận được đánh giá mới liên quan đến công việc {jobTitle}.",
  },
  [NotificationType.PAYMENT_CONFIRMED]: {
    title: "Xác nhận thanh toán",
    message: "Thanh toán cho công việc {jobTitle} đã được xác nhận.",
  },
  [NotificationType.PAYMENT_DISPUTED]: {
    title: "Khiếu nại thanh toán",
    message: "Có khiếu nại bồi thường về công việc {jobTitle}: {reason}",
  },
  [NotificationType.DISPUTE_RESOLVED]: {
    title: "Đã giải quyết Khiếu nại",
    message: "Khiếu nại về công việc {jobTitle} đã được xử lý xong.",
  },
};

/**
 * Replace {key} với giá trị từ data
 */
function formatTemplate(
  template: string,
  data: Record<string, unknown> | null,
): string {
  if (!data) return template;

  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = data[key];
    return value !== undefined && value !== null ? String(value) : "";
  });
}

/**
 * Render title từ notification
 */
export function getNotificationTitle(notification: Notification): string {
  if (!notification?.type) return "Thông báo";
  
  if (notification.type === NotificationType.SYSTEM && notification.data?.title) {
    return String(notification.data.title);
  }

  const template = NOTIFICATION_TEMPLATES[notification.type];
  if (!template) return "Thông báo";
  return formatTemplate(template.title, notification.data);
}

/**
 * Render message từ notification
 */
export function getNotificationMessage(notification: Notification): string {
  if (!notification?.type) return "";

  if (notification.type === NotificationType.SYSTEM) {
    if (notification.data?.message) return String(notification.data.message);
    if (notification.data?.content) return String(notification.data.content);
  }

  const template = NOTIFICATION_TEMPLATES[notification.type];
  if (!template) return "";
  return formatTemplate(template.message, notification.data);
}

/**
 * Map notification -> route để navigate khi click
 * FE tự quyết định route dựa vào refType + refId
 */
export function getNotificationRoute(
  notification: Notification,
): string | null {
  const { refType, refId } = notification;
  const data = notification.data ?? {};
  const dataJobId =
    typeof data.jobId === "string"
      ? data.jobId
      : typeof data.job_id === "string"
        ? data.job_id
        : null;
  const dataApplicationId =
    typeof data.applicationId === "string"
      ? data.applicationId
      : typeof data.application_id === "string"
        ? data.application_id
        : null;

  if (!refType || !refId) {
    switch (notification.type) {
      case NotificationType.JOB_APPLICATION_RECEIVED:
      case NotificationType.JOB_CHECKED_IN:
      case NotificationType.APPLICATION_CANCELLED:
      case NotificationType.JOB_COMPLETED:
      case NotificationType.JOB_CANCELLED:
      case NotificationType.PAYMENT_CONFIRMED:
        return dataJobId ? `/jobs/${dataJobId}` : null;

      case NotificationType.JOB_APPLICATION_ACCEPTED:
      case NotificationType.JOB_APPLICATION_REJECTED:
        return dataApplicationId
          ? `/applications/${dataApplicationId}/progress`
          : dataJobId
            ? `/jobs/${dataJobId}`
            : null;

      case NotificationType.PAYMENT_DISPUTED:
      case NotificationType.DISPUTE_RESOLVED:
      case NotificationType.REVIEW_RECEIVED:
        return dataJobId ? `/jobs/${dataJobId}` : null;

      default:
        return null;
    }
  }

  switch (refType) {
    case ReferenceType.ORDER:
      return `/orders/${refId}`;

    case ReferenceType.PAYMENT:
      return `/payments/${refId}`;

    case ReferenceType.USER:
      return `/users/${refId}`;

    case ReferenceType.POST:
      return `/posts/${refId}`;

    case ReferenceType.COMMENT:
      return `/posts?commentId=${refId}`;

    case ReferenceType.PRODUCT:
      return `/products/${refId}`;

    case ReferenceType.PROMOTION:
      return `/promotions/${refId}`;

    case ReferenceType.JOB:
      return `/jobs/${refId}`;

    case ReferenceType.JOB_APPLICATION:
      return `/applications/${refId}/progress`;

    case ReferenceType.REVIEW:
      return dataJobId ? `/jobs/${dataJobId}` : null;

    case ReferenceType.DISPUTE:
      return dataJobId ? `/jobs/${dataJobId}` : null;

    default:
      return null;
  }
}

/**
 * Map notification type -> icon name (dùng cho icon library)
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    // Order
    case NotificationType.ORDER_CREATED:
    case NotificationType.ORDER_CONFIRMED:
    case NotificationType.ORDER_SHIPPED:
    case NotificationType.ORDER_DELIVERED:
    case NotificationType.ORDER_CANCELLED:
      return "package";

    // Payment
    case NotificationType.PAYMENT_SUCCESS:
      return "check-circle";
    case NotificationType.PAYMENT_FAILED:
      return "x-circle";

    // Social
    case NotificationType.USER_FOLLOWED:
      return "user-plus";
    case NotificationType.POST_LIKED:
      return "heart";
    case NotificationType.POST_COMMENTED:
    case NotificationType.COMMENT_REPLIED:
      return "message-circle";

    // Promotion
    case NotificationType.PROMOTION:
      return "gift";

    // System
    case NotificationType.SYSTEM:
    default:
      return "bell";
  }
}

/**
 * Map notification type -> màu sắc
 */
export function getNotificationColor(
  type: NotificationType,
): "default" | "success" | "warning" | "error" | "info" {
  switch (type) {
    case NotificationType.ORDER_DELIVERED:
    case NotificationType.PAYMENT_SUCCESS:
      return "success";

    case NotificationType.ORDER_CANCELLED:
    case NotificationType.PAYMENT_FAILED:
      return "error";

    case NotificationType.ORDER_SHIPPED:
      return "warning";

    case NotificationType.PROMOTION:
      return "info";

    default:
      return "default";
  }
}
