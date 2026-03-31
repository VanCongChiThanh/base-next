import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "GigWork - Nền tảng việc làm thời vụ",
  description: "Tìm kiếm và đăng tuyển việc làm thời vụ nhanh chóng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased bg-background min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
