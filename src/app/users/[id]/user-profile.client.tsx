"use client";

import { useState, useEffect } from "react";
import { reviewService } from "@/services/review.service";
import { workerServiceAPI } from "@/services/worker-service.service";
import { jobService } from "@/services/job.service";
import apiClient from "@/lib/api-client";
import { Review, WorkerService, Job, JobStatus } from "@/types";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Avatar } from "@/components/admin";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/contexts";

interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role?: string;
  verificationLevel?: string;
  createdAt?: string;
  workerProfile?: {
    ratingAvg: number;
    totalReviews: number;
    totalJobsCompleted: number;
    bio: string | null;
  } | null;
  employerProfile?: {
    ratingAvg: number;
    totalReviews: number;
    totalJobsPosted: number;
    companyName: string | null;
    companyDescription: string | null;
  } | null;
}

const StarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

type ReviewTab = "all" | "hire" | "post";

const average = (list: Review[]) =>
  list.length > 0 ? list.reduce((acc, r) => acc + r.rating, 0) / list.length : 0;

export default function UserProfileClient({ id }: { id: string }) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<WorkerService[]>([]);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTab, setReviewTab] = useState<ReviewTab>("all");

  useEffect(() => {
    Promise.all([
      apiClient.get<PublicProfile>(`/users/${id}/public`),
      reviewService.getByUser(id, 1, 50),
      workerServiceAPI.getServicesByWorker(id).catch(() => []), // fallback for error
      jobService
        .findJobs({ employerId: id, status: JobStatus.OPEN, limit: 12 })
        .catch(() => null),
    ])
      .then(([userData, reviewsRes, servicesRes, jobsRes]) => {
        setProfile(userData);
        setReviews(reviewsRes?.data || (Array.isArray(reviewsRes) ? reviewsRes : []));
        setServices(servicesRes || []);
        setPostedJobs(jobsRes?.data || []);
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

  // Prefer the server-computed aggregate (kept in sync from the reviews table).
  // Fall back to averaging the fetched reviews if no aggregate is available.
  const profileRating =
    profile.workerProfile?.ratingAvg ?? profile.employerProfile?.ratingAvg;
  const profileTotal =
    profile.workerProfile?.totalReviews ?? profile.employerProfile?.totalReviews;
  const headerRating = profileTotal ? Number(profileRating) || 0 : average(reviews);
  const headerCount = profileTotal ?? reviews.length;

  const directHireReviews = reviews.filter((r) => r.job?.isDirectHire);
  const jobPostReviews = reviews.filter((r) => !r.job?.isDirectHire);

  const activeReviews =
    reviewTab === "hire"
      ? directHireReviews
      : reviewTab === "post"
      ? jobPostReviews
      : reviews;

  const isOrg = profile.role === "ORGANIZATION" || profile.role === "RECRUITER";
  const displayName =
    (isOrg && profile.employerProfile?.companyName) ||
    `${profile.firstName} ${profile.lastName}`;

  const renderReview = (r: Review) => (
    <div key={r.id} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={r.reviewer?.avatarUrl} size="sm" />
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {r.reviewer?.firstName} {r.reviewer?.lastName}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{formatRelativeTime(r.createdAt)}</p>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  r.job?.isDirectHire
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {r.job?.isDirectHire ? "Thuê ngay" : "Tin tuyển dụng"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex text-yellow-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className={`w-4 h-4 ${i < r.rating ? "text-yellow-400" : "text-gray-200"}`} />
          ))}
        </div>
      </div>
      {r.comment && (
        <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{r.comment}</p>
      )}
    </div>
  );

  const tabButton = (tab: ReviewTab, label: string, count: number) => (
    <button
      onClick={() => setReviewTab(tab)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        reviewTab === tab
          ? "bg-gray-900 text-white"
          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar src={profile.avatarUrl} size="lg" />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center sm:justify-start">
                {displayName}
                {profile.verificationLevel && profile.verificationLevel !== "NONE" && (
                  <div title={profile.verificationLevel === "BUSINESS" ? "Doanh nghiệp đã xác thực" : "Đã xác thực"}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-500">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </h1>
              <p className="text-gray-500 mt-1">Thành viên từ {new Date(profile.createdAt || "").getFullYear()}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  {headerRating.toFixed(1)} / 5.0
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {headerCount} đánh giá
                </div>
                {!!profile.workerProfile?.totalJobsCompleted && (
                  <div className="text-sm text-gray-500 font-medium">
                    {profile.workerProfile.totalJobsCompleted} việc hoàn thành
                  </div>
                )}
                {!!profile.employerProfile?.totalJobsPosted && (
                  <div className="text-sm text-gray-500 font-medium">
                    {profile.employerProfile.totalJobsPosted} tin đã đăng
                  </div>
                )}
              </div>

              {profile.employerProfile?.companyDescription && (
                <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap">
                  {profile.employerProfile.companyDescription}
                </p>
              )}
              {!profile.employerProfile?.companyDescription && profile.workerProfile?.bio && (
                <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap">
                  {profile.workerProfile.bio}
                </p>
              )}
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
                  Thuê ngay
                </Link>
              </div>
            )}
          </div>

          {/* Worker Services List */}
          {services.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Dịch vụ "Thuê tôi"</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map(service => {
                  const hasImage = service.portfolioUrls && service.portfolioUrls.length > 0;
                  const coverImage = hasImage
                    ? service.portfolioUrls[0]
                    : "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=400";

                  return (
                    <div key={service.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="aspect-video w-full overflow-hidden relative">
                        <img
                          src={coverImage}
                          alt={service.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          {service.isAvailableNow ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm">
                              Sẵn sàng làm ngay
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-500/90 text-white backdrop-blur-sm shadow-sm">
                              Đang bận
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900 line-clamp-1 flex-1">{service.title}</h3>
                          <div className="flex flex-col items-end shrink-0 ml-2">
                            <span className="font-bold text-blue-600">
                              {Number(service.price).toLocaleString("vi-VN")}đ
                              {service.priceType === "HOURLY" ? "/giờ" : ""}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">(Đề xuất)</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{service.description}</p>

                        {/* More images preview if any */}
                        {hasImage && service.portfolioUrls.length > 1 && (
                          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                            {service.portfolioUrls.slice(1).map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Ảnh ${idx+2}`}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                              />
                            ))}
                          </div>
                        )}

                        {service.workerId !== currentUser?.id && (
                          <Link
                            href={`/jobs/post?hire_id=${profile.id}&service_id=${service.id}`}
                            className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Thuê người này
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Posted Jobs (for employers / individuals who post jobs) */}
          {postedJobs.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Việc đang tuyển</h2>
              <div className="space-y-3">
                {postedJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 line-clamp-1">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {job.category?.name || "Khác"} · {formatRelativeTime(job.createdAt)}
                      </p>
                    </div>
                    {job.salaryPerHour ? (
                      <span className="shrink-0 text-sm font-bold text-blue-600 whitespace-nowrap">
                        {Number(job.salaryPerHour).toLocaleString("vi-VN")}đ/giờ
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Đánh giá nhận được</h2>
              <div className="flex flex-wrap gap-2">
                {tabButton("all", "Tất cả", reviews.length)}
                {tabButton("hire", "Thuê ngay", directHireReviews.length)}
                {tabButton("post", "Tin tuyển dụng", jobPostReviews.length)}
              </div>
            </div>

            {/* Per-source summary */}
            {reviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3">
                  <p className="text-xs text-blue-600 font-medium">Từ thuê ngay</p>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                    {average(directHireReviews).toFixed(1)}
                    <span className="text-xs font-normal text-gray-500">({directHireReviews.length})</span>
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3">
                  <p className="text-xs text-emerald-600 font-medium">Từ tin tuyển dụng</p>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                    {average(jobPostReviews).toFixed(1)}
                    <span className="text-xs font-normal text-gray-500">({jobPostReviews.length})</span>
                  </p>
                </div>
              </div>
            )}

            {activeReviews.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Chưa có đánh giá nào ở mục này.</div>
            ) : (
              <div className="space-y-6">{activeReviews.map(renderReview)}</div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
