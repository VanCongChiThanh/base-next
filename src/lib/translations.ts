export const ERROR_MESSAGES_VI: Record<string, string> = {
  // Authentication & Authorization
  "Unauthorized": "Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
  "Forbidden resource": "Bạn không có quyền thực hiện hành động này.",
  "Invalid credentials": "Tên đăng nhập hoặc mật khẩu không đúng.",
  "User already exists": "Tài khoản (email hoặc số điện thoại) đã tồn tại trong hệ thống.",
  
  // Job & Application
  "Job not found": "Không tìm thấy công việc này.",
  "Cannot apply to your own job": "Bạn không thể ứng tuyển vào công việc do chính mình đăng.",
  "Already applied to this job": "Bạn đã ứng tuyển công việc này rồi.",
  "Job is not open for applications": "Công việc này hiện đã đóng hoặc không nhận thêm ứng viên.",
  "Application not found": "Không tìm thấy hồ sơ ứng tuyển.",
  "Messaging is only available after acceptance and before the job is completed":
    "Nhắn tin chỉ dùng được sau khi đơn được chấp nhận và trước khi hoàn thành ca.",
  
  // Profile
  "Profile not found": "Không tìm thấy hồ sơ cá nhân.",
  "Worker profile already exists": "Hồ sơ người lao động đã tồn tại.",
  "Employer profile already exists": "Hồ sơ nhà tuyển dụng đã tồn tại.",
  
  // Validation constraints (NestJS class-validator common strings partially matched)
  "email must be an email": "Định dạng email không hợp lệ.",
  "password must be longer than or equal to 6 characters": "Mật khẩu phải dài từ 6 ký tự trở lên.",
  "phone number must be valid": "Số điện thoại không hợp lệ.",
  
  // Common
  "Internal server error": "Đã xảy ra lỗi trên hệ thống, vui lòng thử lại sau.",
  "Bad Request Exception": "Yêu cầu không hợp lệ.",
  "Not Found": "Không tìm thấy dữ liệu.",
};

export function translateErrorMessage(message: string): string {
  if (!message) return "Đã xảy ra lỗi hệ thống.";
  
  let lang = "vi";
  if (typeof window !== "undefined") {
    lang = localStorage.getItem("lang") || "vi";
  }

  // If language is English, just return message 
  if (lang === "en") return message;
  
  // Exact match VI
  if (ERROR_MESSAGES_VI[message]) {
    return ERROR_MESSAGES_VI[message];
  }

  // Partial matches for validation array
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("must be an email")) return "Email không hợp lệ.";
  if (lowerMsg.includes("must be longer than")) return "Độ dài dữ liệu không đạt yêu cầu thiểu.";
  if (lowerMsg.includes("should not be empty")) return "Vui lòng nhập đầy đủ các trường bắt buộc.";
  if (lowerMsg.includes("must be a valid phone number")) return "Số điện thoại không hợp lệ.";
  
  return message;
}
