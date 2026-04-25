import { Metadata } from "next";
import JobsPageClient from "./jobs.client";

export const metadata: Metadata = {
  title: "Tìm Việc Làm Thời Vụ - GigWork",
  description: "Duyệt qua danh sách các công việc thời vụ mới nhất, lọc theo mức lương, danh mục, và địa điểm. Đặc biệt phù hợp cho sinh viên và người tìm việc tự do.",
  openGraph: {
    title: "Tìm Việc Làm Thời Vụ - GigWork",
    description: "Tìm công việc thời vụ ưng ý nhất và ứng tuyển ngay trên GigWork.",
  },
};

export default function JobsPage() {
  return <JobsPageClient />;
}
