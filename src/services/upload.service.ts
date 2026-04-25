import apiClient from "@/lib/api-client";
import { PresignedUrlRequest, PresignedUrlResponse } from "@/types";

export const uploadService = {
  /**
   * Get signature for Cloudinary upload
   */
  async getPresignedUrl(
    data: PresignedUrlRequest,
  ): Promise<PresignedUrlResponse> {
    return apiClient.post("/uploads/presigned-url", data);
  },

  /**
   * Upload file to Cloudinary
   */
  async uploadFile(file: File): Promise<string> {
    // Get signature
    const data = await this.getPresignedUrl({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", data.apiKey);
    formData.append("timestamp", data.timestamp.toString());
    formData.append("signature", data.signature);
    formData.append("folder", data.folder);

    const res = await fetch(data.uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to upload file");
    }

    const result = await res.json();
    return result.secure_url;
  },
};

export default uploadService;
