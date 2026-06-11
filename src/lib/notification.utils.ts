import { Notification, NotificationType, ReferenceType } from "@/types";

/**
 * Template cho notification - FE tá»± Ä‘á»‹nh nghÄ©a title/message
 * Dá»… dÃ ng há»— trá»£ i18n: chá»‰ cáº§n thay Ä‘á»•i templates theo locale
 */
interface NotificationTemplate {
  title: string;
  message: string; // DÃ¹ng {key} Ä‘á»ƒ replace vá»›i data
}

/**
 * Notification templates - Tiáº¿ng Viá»‡t
 * TODO: Khi cáº§n i18n, load templates tá»« file JSON theo locale
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
    title: "ứng viên mới",
    message:
      "Bạn có ứng viên mới ứng tuyển vào công việc: {jobTitle}. {message}",
  },
  [NotificationType.JOB_APPLICATION_ACCEPTED]: {
    title: "ứng tuyển thành công",
    message:
      "Hồ sơ của bạn cho công việc {jobTitle} đã được chấp nhận. {message}",
  },
  [NotificationType.JOB_APPLICATION_REJECTED]: {
    title: "ứng tuyển bị từ chối",
    message: "Trạng thái công việc {jobTitle}: {message}",
  },
  [NotificationType.JOB_COMPLETED]: {
    title: "Công việc hoàn thành",
    message: "Công việc {jobTitle} đã kết thúc.",
  },
  [NotificationType.JOB_CANCELLED]: {
    title: "Công việc bị hủy",
    message: "Công việc {jobTitle} đã bị hủy.",
  },
  [NotificationType.JOB_CHECKED_IN]: {
    title: "ứng viên đã Điểm danh",
    message: "ứng viên đã đến làm việc tại {jobTitle}.",
  },
  [NotificationType.HOURS_LOGGED]: {
    title: "Báo cáo số giờ làm",
    message: "{message}",
  },
  [NotificationType.APPLICATION_CANCELLED]: {
    title: "ứng viên hủy ứng tuyển",
    message: "Một ứng viên đã rút lý lịch cho công việc {jobTitle}.",
  },
  [NotificationType.APPLICATION_MESSAGE]: {
    title: "Tin nhắn mới",
    message: "{senderName}: {preview}",
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
    message: "Có khiếu nại về thanh toán cho công việc {jobTitle}: {reason}",
  },
  [NotificationType.DISPUTE_RESOLVED]: {
    title: "Đã giải quyết khiếu nại",
    message: "Khiếu nại về công việc {jobTitle} đã được xử lý xong.",
  },

  // Escrow / Milestones
  [NotificationType.ESCROW_DEPOSITED]: {
    title: "Ký quỹ thành công",
    message: "Đã ký quỹ thành công cho công việc {jobTitle}.",
  },
  [NotificationType.ESCROW_RELEASED]: {
    title: "Tiền đã được giải ngân",
    message: "Tiền đã được giải ngân thành công cho {milestoneTitle}.",
  },
  [NotificationType.ESCROW_REFUNDED]: {
    title: "Hoàn tiền ký quỹ",
    message: "Tiền ký quỹ đã được hoàn lại cho nhà tuyển dụng.",
  },
  [NotificationType.MILESTONE_SUBMITTED]: {
    title: "Milestone đã được nộp",
    message: "Worker đã nộp kết quả công việc cho milestone {milestoneTitle}.",
  },
  [NotificationType.MILESTONE_PROPOSED]: {
    title: "Đề xuất Milestone mới",
    message: "Worker đã đề xuất một milestone mới cho công việc {jobTitle}.",
  },
  [NotificationType.MILESTONE_PROPOSAL_RESPONDED]: {
    title: "Phản hồi đề xuất Milestone",
    message: "Nhà tuyển dụng đã phản hồi về đề xuất milestone của bạn.",
  },
  [NotificationType.MILESTONE_APPROVED]: {
    title: "Milestone được chấp nhận",
    message: "Nhà tuyển dụng đã chấp nhận kết quả milestone {milestoneTitle}.",
  },
  [NotificationType.MILESTONE_RELEASED]: {
    title: "Tiền giải ngân Milestone đã được gửi",
    message: "Tiền của milestone {milestoneTitle} đã được Admin chuyển khoản. Vui lòng kiểm tra tài khoản và xác nhận Đã Nhận Tiền.",
  },
  [NotificationType.MILESTONE_REVISION_REQUESTED]: {
    title: "Yêu cầu chỉnh sửa",
    message: "Nhà tuyển dụng yêu cầu chỉnh sửa milestone {milestoneTitle}.",
  },
};

/**
 * Replace {key} vá»›i giÃ¡ trá»‹ tá»« data
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
 * Render title tá»« notification
 */
export function getNotificationTitle(notification: Notification): string {
  if (!notification?.type) return "ThÃ´ng bÃ¡o";
  
  if (notification.type === NotificationType.SYSTEM && notification.data?.title) {
    return String(notification.data.title);
  }

  const template = NOTIFICATION_TEMPLATES[notification.type];
  if (!template) return "Thông báo";

  if (notification.type === NotificationType.JOB_APPLICATION_RECEIVED && notification.data?.isDirectHire) {
    return "Yêu cầu Thuê ngay";
  }

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

  if (notification.type === NotificationType.JOB_APPLICATION_RECEIVED && notification.data?.isDirectHire) {
    return `Bạn nhận được lời đề nghị Thuê ngay cho công việc: ${notification.data?.jobTitle || 'Chưa cập nhật'}.`;
  }

  // If backend provides a custom message and the template doesn't explicitly format it, use the custom message
  if (notification.data?.message && !template.message.includes("{message}")) {
    return String(notification.data.message);
  }

  return formatTemplate(template.message, notification.data);
}

/**
 * Map notification -> route 
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
      case NotificationType.JOB_CANCELLED:
      case NotificationType.PAYMENT_DISPUTED:
      case NotificationType.DISPUTE_RESOLVED:
      case NotificationType.REVIEW_RECEIVED:
      case NotificationType.ESCROW_DEPOSITED:
      case NotificationType.ESCROW_RELEASED:
      case NotificationType.ESCROW_REFUNDED:
      case NotificationType.MILESTONE_SUBMITTED:
      case NotificationType.MILESTONE_PROPOSED:
      case NotificationType.MILESTONE_PROPOSAL_RESPONDED:
      case NotificationType.MILESTONE_APPROVED:
      case NotificationType.MILESTONE_RELEASED:
      case NotificationType.MILESTONE_REVISION_REQUESTED:
        return dataJobId ? `/jobs/${dataJobId}` : null;

      case NotificationType.JOB_COMPLETED:
      case NotificationType.HOURS_LOGGED:
      case NotificationType.JOB_CHECKED_IN:
      case NotificationType.APPLICATION_CANCELLED:
      case NotificationType.PAYMENT_CONFIRMED:
      case NotificationType.JOB_APPLICATION_ACCEPTED:
      case NotificationType.JOB_APPLICATION_REJECTED:
        return dataJobId ? `/jobs/${dataJobId}` : null;

      default:
        return null;
    }
  }

  switch (refType) {
    case ReferenceType.ORDER:
      return `/orders/${refId}`;

    case ReferenceType.PAYMENT:
      return dataJobId ? `/jobs/${dataJobId}` : null;

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
      return dataJobId ? `/jobs/${dataJobId}` : null;

    case ReferenceType.REVIEW:
      return dataJobId ? `/jobs/${dataJobId}` : null;

    case ReferenceType.DISPUTE:
      return dataJobId ? `/jobs/${dataJobId}` : null;

    case "ESCROW" as ReferenceType:
    case "MILESTONE" as ReferenceType:
      return dataJobId ? `/jobs/${dataJobId}` : null;

    default:
      // Fallback: check notification type one more time in case refType was unexpected
      if (
        [
          NotificationType.ESCROW_DEPOSITED,
          NotificationType.ESCROW_RELEASED,
          NotificationType.ESCROW_REFUNDED,
          NotificationType.MILESTONE_SUBMITTED,
          NotificationType.MILESTONE_PROPOSED,
          NotificationType.MILESTONE_PROPOSAL_RESPONDED,
          NotificationType.MILESTONE_APPROVED,
          NotificationType.MILESTONE_RELEASED,
          NotificationType.MILESTONE_REVISION_REQUESTED,
        ].includes(notification.type)
      ) {
        return dataJobId ? `/jobs/${dataJobId}` : null;
      }
      return null;
  }
}

/**
 * Map notification type -> icon name (dÃ¹ng cho icon library)
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

    // Job
    case NotificationType.HOURS_LOGGED:
      return "clock";

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
 * Map notification type -> mÃ u sáº¯c
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

    case NotificationType.HOURS_LOGGED:
    case NotificationType.PROMOTION:
      return "info";

    default:
      return "default";
  }
}

