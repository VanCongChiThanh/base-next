import { Metadata } from "next";
import HomePageClient from "./home.client";

export const metadata: Metadata = {
  title: "GigWork - Nền tảng việc làm thời vụ số 1 Việt Nam",
  description: "Khám phá hàng ngàn công việc thời vụ, việc làm bán thời gian, kiếm tiền nhanh chóng. Đăng tuyển dễ dàng và miễn phí trên GigWork.",
  openGraph: {
    title: "GigWork - Tìm việc thời vụ dễ dàng",
    description: "Kết nối người tìm việc với nhà tuyển dụng nhanh nhất.",
    url: "https://gigwork.vn",
    siteName: "GigWork",
    locale: "vi_VN",
    type: "website",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
