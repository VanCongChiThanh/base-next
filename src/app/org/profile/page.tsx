"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Camera, Image as ImageIcon, Plus, X, Building, MapPin, Phone, UploadCloud } from "lucide-react";
import { useAuth } from "@/contexts";
import { profileService, userService, uploadService } from "@/services";
import { EmployerProfile } from "@/types";

export default function OrgProfilePage() {
  const { user, refreshUser } = useAuth();
  
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  // Image State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  
  // Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await profileService.getEmployerProfile();
      setProfile(data);
      
      setCompanyName(data.companyName || "");
      setCompanyDescription(data.companyDescription || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      
      setAvatarUrl(user.avatarUrl || null);
      setBannerUrl(data.bannerUrl || null);
      setGalleryUrls(data.galleryUrls || []);
    } catch (error) {
      console.error("Failed to fetch employer profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Update User Avatar
      if (avatarUrl !== user?.avatarUrl) {
        await userService.updateProfile({ avatarUrl: avatarUrl || undefined });
        await refreshUser();
      }
      
      // Update Employer Profile
      await profileService.updateEmployerProfile({
        companyName,
        companyDescription,
        phone,
        address,
        bannerUrl: bannerUrl || undefined,
        galleryUrls,
      });
      
      toast.success("Đã lưu hồ sơ thành công!");
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Có lỗi xảy ra khi lưu hồ sơ.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploadingAvatar(true);
      const url = await uploadService.uploadFile(file);
      setAvatarUrl(url);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Tải ảnh thất bại.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploadingBanner(true);
      const url = await uploadService.uploadFile(file);
      setBannerUrl(url);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Tải ảnh thất bại.");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    try {
      setIsUploadingGallery(true);
      const uploadPromises = files.map(file => uploadService.uploadFile(file));
      const urls = await Promise.all(uploadPromises);
      setGalleryUrls(prev => [...prev, ...urls]);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Tải ảnh thất bại.");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryUrls(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải hồ sơ...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hồ sơ công ty</h1>
          <p className="text-slate-500 mt-1">Cập nhật thông tin chi tiết và hình ảnh giới thiệu công ty</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Images Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Hình ảnh</h2>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Banner */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh bìa (Banner)</label>
              <div className="relative w-full h-48 md:h-64 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center group">
                {bannerUrl ? (
                  <>
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-medium transition-colors">
                        <ImageIcon className="w-5 h-5 inline-block mr-2" />
                        Đổi ảnh bìa
                        <input type="file" className="hidden" accept="image/*" onChange={handleUploadBanner} disabled={isUploadingBanner} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      {isUploadingBanner ? "Đang tải lên..." : "Tải lên ảnh bìa"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 5MB</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleUploadBanner} disabled={isUploadingBanner} />
                  </label>
                )}
              </div>
            </div>

            {/* Avatar & Basic Info */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh đại diện (Logo)</label>
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Building className="w-12 h-12" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleUploadAvatar} disabled={isUploadingAvatar} />
                  </label>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên tổ chức / công ty</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="VD: TechCorp Vietnam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="VD: 0901234567"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ văn phòng</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                    <textarea 
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      rows={2}
                      placeholder="VD: Tòa nhà Bitexco, Quận 1, TP.HCM"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Description */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Giới thiệu công ty</h2>
          </div>
          <div className="p-6">
            <textarea 
              value={companyDescription}
              onChange={e => setCompanyDescription(e.target.value)}
              className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              rows={6}
              placeholder="Viết một đoạn ngắn giới thiệu về văn hóa, môi trường làm việc và lĩnh vực hoạt động của tổ chức..."
            />
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Ảnh nổi bật (Văn hóa, hoạt động...)</h2>
            <label className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors cursor-pointer flex items-center text-sm">
              <UploadCloud className="w-4 h-4 mr-2" />
              {isUploadingGallery ? "Đang tải..." : "Tải ảnh lên"}
              <input type="file" multiple className="hidden" accept="image/*" onChange={handleUploadGallery} disabled={isUploadingGallery} />
            </label>
          </div>
          <div className="p-6">
            {galleryUrls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200">
                    <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <button 
                      onClick={() => handleRemoveGalleryImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {/* Upload More Button */}
                <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                  <Plus className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-slate-500">Thêm ảnh</span>
                  <input type="file" multiple className="hidden" accept="image/*" onChange={handleUploadGallery} disabled={isUploadingGallery} />
                </label>
              </div>
            ) : (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-slate-900 mb-1">Chưa có ảnh nổi bật</h3>
                <p className="text-sm text-slate-500 mb-4">Tải lên các hình ảnh về văn phòng, sự kiện của công ty để thu hút ứng viên hơn.</p>
                <label className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Chọn ảnh tải lên
                  <input type="file" multiple className="hidden" accept="image/*" onChange={handleUploadGallery} disabled={isUploadingGallery} />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
