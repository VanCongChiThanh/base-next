import { Metadata } from "next";
import JobDetailPageClient from "./job-detail.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let title = "Chi Tiết Việc Làm - GigWork";
  let description = "Khám phá chi tiết công việc thời vụ trên GigWork. Xem yêu cầu, mức lương và ứng tuyển ngay.";

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`, {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      const { data } = await res.json();
      if (data && data.title) {
        title = `${data.title} - GigWork`;
        if (data.description) {
          description = data.description.substring(0, 160) + (data.description.length > 160 ? "..." : "");
        }
      }
    }
  } catch (error) {
    // fallback
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <JobDetailPageClient params={params} />;
}
