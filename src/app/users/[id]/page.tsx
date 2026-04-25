import { Metadata } from "next";
import UserProfileClient from "./user-profile.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  // In a real app, we'd fetch the user data here to set dynamic title
  // But for simple SEO, a generic one works with Next.js SSR
  return {
    title: "Hồ Sơ Người Dùng | Nền Tảng Việc Làm Tự Do",
    description: "Xem hồ sơ công khai, đánh giá và kỹ năng của người dùng.",
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <UserProfileClient id={resolvedParams.id} />;
}
