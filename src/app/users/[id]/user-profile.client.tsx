"use client";

import { useState, useEffect } from "react";
import { reviewService } from "@/services/review.service";
import apiClient from "@/lib/api-client";
import { Review, User } from "@/types";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Avatar } from "@/components/admin";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/contexts";

const StarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

export default function UserProfileClient({ id }: { id: string }) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<Partial<User>>(`/users/${id}/public`),
      reviewService.getByUser(id),
    ])
      .then(([userData, reviewsRes]) => {
        setProfile(userData);
        setReviews(reviewsRes?.data || (Array.isArray(reviewsRes) ? reviewsRes : []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </main>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Không tìm thấy người dùng.</div>
        </main>
        <Footer />
      </>
    );
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar src={profile.avatarUrl} size="lg" />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-gray-500 mt-1">Thành viên từ {new Date(profile.createdAt || "").getFullYear()}</p>
              
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  {avgRating.toFixed(1)} / 5.0
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {reviews.length} đánh giá
                </div>
              </div>
            </div>

            {/* Actions */}
            {currentUser?.id !== profile.id && (
              <div className="mt-6 sm:mt-0 sm:ml-auto">
                <Link
                  href={`/jobs/post?hire_id=${profile.id}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Thuê tôi
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Đánh giá nhận được</h2>
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Người dùng này chưa có đánh giá nào.</div>
            ) : (
              <div className="space-y-6">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={r.reviewer?.avatarUrl} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {r.reviewer?.firstName} {r.reviewer?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{formatRelativeTime(r.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon key={i} className={`w-4 h-4 ${i < r.rating ? "text-yellow-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
