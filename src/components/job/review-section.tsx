"use client";

import { useState } from "react";
import { reviewService } from "@/services";
import { Review, CreateReviewRequest } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api-client";
import { ApiError } from "@/types";

interface ReviewSectionProps {
  jobId: string;
  reviews: Review[];
  canReview: boolean;
  revieweeId?: string;
  currentUserId?: string;
  onReviewCreated: (review: Review) => void;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? "cursor-default" : "cursor-pointer"} transition-transform ${!readonly && hover >= star ? "scale-110" : ""}`}
        >
          <svg
            className={`w-5 h-5 ${(hover || value) >= star ? "text-amber-400 fill-amber-400" : "text-gray-300 fill-gray-300"}`}
            viewBox="0 0 24 24"
          >
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({ jobId, reviews, canReview, revieweeId, currentUserId, onReviewCreated }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const alreadyReviewed = reviews.some((r) => r.reviewerId === currentUserId);

  const handleSubmit = async () => {
    if (!revieweeId || rating < 1) return;
    setSubmitting(true);
    setError("");
    try {
      const review = await reviewService.create({
        jobId,
        revieweeId,
        rating,
        comment: comment || undefined,
      });
      onReviewCreated(review);
      setShowForm(false);
      setComment("");
      setRating(5);
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Đánh giá ({reviews.length})
        </h2>
        {canReview && !alreadyReviewed && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Viết đánh giá
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div className="mb-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét (không bắt buộc)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Huỷ</button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Chưa có đánh giá nào</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {review.reviewer.firstName?.charAt(0)}{review.reviewer.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900">{review.reviewer.firstName} {review.reviewer.lastName}</span>
                  <StarRating value={review.rating} readonly />
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(review.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
