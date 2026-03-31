import { NotificationType, ReferenceType } from "./enums";

/**
 * Notification từ BE
 * - BE only sends: type, refType, refId, data
 * - FE renders title/message based on type + data (supports i18n)
 */
export interface Notification {
  id: string;
  type: NotificationType;
  refType: ReferenceType | null;
  refId: string | null;
  /** Data to render message (e.g., { orderCode: 'ORD-001', userName: 'John' }) */
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}
