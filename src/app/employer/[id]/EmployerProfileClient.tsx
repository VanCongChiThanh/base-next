"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Phone, Star, CheckCircle, ChevronLeft, Map, Mail } from "lucide-react";
import { profileService, jobService } from "@/services";
import { EmployerProfile, Job, JobStatus } from "@/types";

export default function EmployerProfileClient({ id }: { id: string }) {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        // We use the new endpoint getEmployerProfileByUserId
        const profileData = await profileService.getEmployerProfileByUserId(id);
        setProfile(profileData);
        
        // Fetch jobs for this employer
        const jobsData = await jobService.findJobs({ employerId: id, status: JobStatus.OPEN } as any);
        setJobs(jobsData.data);
      } catch (error) {
        console.error("Failed to fetch employer profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Building2 className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy tổ chức</h1>
        <p className="text-slate-500 mb-6">Hồ sơ tổ chức này không tồn tại hoặc đã bị ẩn.</p>
        <Link href="/jobs" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Quay lại tìm việc
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Banner */}
      <div className="h-64 md:h-80 w-full bg-slate-800 relative">
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-slate-800" />
        )}
        <div className="absolute top-4 left-4">
          <Link href="/jobs" className="flex items-center text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Tìm việc
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24 relative z-10">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg bg-white overflow-hidden flex-shrink-0">
              {/* NOTE: We assume profile.user.avatarUrl is passed down, but if not we might just use Building2 icon */}
              {/* Since we don't have user object directly in EmployerProfile without joining, let's use a placeholder if we don't have avatarUrl on profile directly. Actually profile is expected to have user relations in API. */}
              {/* @ts-ignore - Assuming API returns user relation */}
              {profile.user?.avatarUrl ? (
                <img src={(profile as any).user.avatarUrl} alt={profile.companyName || "Company"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Building2 className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center">
                    {profile.companyName || "Tổ chức chưa cập nhật tên"}
                    {profile.isVerifiedBusiness && (
                      <CheckCircle className="w-6 h-6 text-emerald-500 ml-2" />
                    )}
                  </h1>
                  
                  <div className="flex flex-wrap gap-y-2 gap-x-6 mt-3 text-sm text-slate-600">
                    {profile.address && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                        {profile.address}
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-slate-400" />
                        {profile.phone}
                      </div>
                    )}
                    {/* @ts-ignore */}
                    {profile.user?.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-slate-400" />
                        {/* @ts-ignore */}
                        {profile.user.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-amber-500 font-bold text-lg">
                      <Star className="w-5 h-5 mr-1 fill-current" />
                      {Number(profile.ratingAvg) > 0 ? Number(profile.ratingAvg).toFixed(1) : "-"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{profile.totalReviews} đánh giá</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-slate-800">{profile.totalJobsPosted}</div>
                    <div className="text-xs text-slate-500 mt-1">Việc làm</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Giới thiệu công ty</h2>
              {profile.companyDescription ? (
                <div className="prose prose-slate max-w-none">
                  {profile.companyDescription.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 text-slate-600 leading-relaxed">{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">Tổ chức chưa cập nhật thông tin giới thiệu.</p>
              )}
            </div>

            {/* Gallery */}
            {profile.galleryUrls && profile.galleryUrls.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Hình ảnh nổi bật</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.galleryUrls.map((url, index) => (
                    <div key={index} className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-200">
                      <img src={url} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Jobs */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              Việc làm đang tuyển 
              <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                {jobs.length}
              </span>
            </h2>
            
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map(job => (
                  <Link href={`/jobs/${job.id}`} key={job.id} className="block bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group">
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{job.title}</h3>
                    <div className="flex items-center text-sm text-slate-500 mt-2">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      {job.provinceCode ? "Có địa điểm cụ thể" : "Làm việc từ xa"}
                    </div>
                    {job.salaryPerHour && (
                      <div className="mt-3 font-semibold text-emerald-600">
                        {job.salaryPerHour.toLocaleString('vi-VN')} đ/giờ
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Hiện chưa có việc làm nào đang tuyển.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon for empty jobs state
import { Briefcase } from "lucide-react";
