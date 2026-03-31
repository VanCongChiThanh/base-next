import apiClient from "@/lib/api-client";
import { PresignedUrlRequest, PresignedUrlResponse } from "@/types";

export const uploadService = {
  /**
   * Get presigned URL for file upload
   */
  async getPresignedUrl(
    data: PresignedUrlRequest,
  ): Promise<PresignedUrlResponse> {
    return apiClient.post("/uploads/presigned-url", data);
  },

  /**
   * Upload file to S3 using presigned URL
   */
  async uploadFile(file: File): Promise<string> {
    // Get presigned URL
    const { uploadUrl, fileUrl } = await this.getPresignedUrl({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // Upload to S3
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    return fileUrl;
  },
};

export default uploadService;
