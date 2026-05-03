"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts";
import { paymentService } from "@/services";
import { Escrow, Milestone, MilestoneStatus, EscrowStatus, Job } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api-client";
import { ApiError } from "@/types";

interface EscrowSectionProps {
  job: Job;
}

export function EscrowSection({ job }: EscrowSectionProps) {
  const { user } = useAuth();
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEmployer = user?.id === job.employerId;
  const isWorker = user?.id !== job.employerId && user != null;

  // Form states
  const [showCreateEscrow, setShowCreateEscrow] = useState(false);
  const [newMilestones, setNewMilestones] = useState([{ title: "", description: "", amount: 0 }]);
  const [showPropose, setShowPropose] = useState(false);
  const [proposal, setProposal] = useState({ title: "", description: "", amount: 0 });

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submitNotes, setSubmitNotes] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const fetchEscrow = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getEscrowByJob(job.id);
      setEscrow(data);
    } catch (err: any) {
      if (err?.errorCode !== "ESCROW_NOT_FOUND") {
        console.error("Error fetching escrow", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrow();
  }, [job.id]);

  const handleCreateEscrow = async () => {
    try {
      setActionLoading("create");
      setError("");
      const validMilestones = newMilestones.filter(m => m.title && m.amount > 0);
      if (validMilestones.length === 0) {
        setError("Vui lòng nhập ít nhất 1 milestone hợp lệ");
        return;
      }
      const res = await paymentService.createEscrow(job.id, validMilestones);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitMilestone = async (milestoneId: string) => {
    try {
      setActionLoading(`submit-${milestoneId}`);
      await paymentService.submitMilestone(milestoneId, submitNotes[milestoneId]);
      setSuccess("Đã nộp kết quả công việc");
      await fetchEscrow();
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewMilestone = async (milestoneId: string, action: 'approve' | 'request_revision') => {
    try {
      setActionLoading(`review-${milestoneId}`);
      await paymentService.reviewMilestone(milestoneId, action, reviewNotes[milestoneId]);
      setSuccess(action === 'approve' ? "Đã duyệt milestone" : "Đã yêu cầu chỉnh sửa");
      await fetchEscrow();
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleProposeMilestone = async () => {
    try {
      setActionLoading("propose");
      if (!proposal.title || proposal.amount <= 0) {
        setError("Vui lòng điền đủ thông tin đề xuất");
        return;
      }
      await paymentService.proposeMilestone(job.id, proposal);
      setSuccess("Đã gửi đề xuất milestone");
      setShowPropose(false);
      setProposal({ title: "", description: "", amount: 0 });
      await fetchEscrow();
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespondProposal = async (milestoneId: string, accept: boolean) => {
    try {
      setActionLoading(`respond-${milestoneId}`);
      await paymentService.respondToProposal(milestoneId, accept);
      setSuccess(accept ? "Đã chấp nhận đề xuất" : "Đã từ chối đề xuất");
      await fetchEscrow();
    } catch (err) {
      setError(getErrorMessage(err as ApiError));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusLabel = (status: MilestoneStatus) => {
    const map = {
      [MilestoneStatus.PENDING]: { text: "Chờ bắt đầu", color: "bg-gray-100 text-gray-700" },
      [MilestoneStatus.IN_PROGRESS]: { text: "Đang thực hiện", color: "bg-blue-100 text-blue-700" },
      [MilestoneStatus.SUBMITTED]: { text: "Chờ duyệt", color: "bg-amber-100 text-amber-700" },
      [MilestoneStatus.APPROVED]: { text: "Đã duyệt", color: "bg-emerald-100 text-emerald-700" },
      [MilestoneStatus.REVISION_REQUESTED]: { text: "Yêu cầu sửa", color: "bg-red-100 text-red-700" },
      [MilestoneStatus.RELEASED]: { text: "Đã giải ngân", color: "bg-purple-100 text-purple-700" },
      [MilestoneStatus.DISPUTED]: { text: "Tranh chấp", color: "bg-red-100 text-red-700" },
    };
    const mapped = map[status];
    if (!mapped) return null;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${mapped.color}`}>{mapped.text}</span>;
  };

  if (loading) return <div className="animate-pulse h-32 bg-blue-50 rounded-2xl" />;

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
      {success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">{success}</div>}

      {!escrow && isEmployer ? (
        <div className="bg-white rounded-2xl border border-blue-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quản lý Thanh toán (Milestones)</h2>
          <p className="text-sm text-gray-500 mb-4">Tạo các cột mốc thanh toán và ký quỹ tiền để bắt đầu công việc.</p>
          
          <div className="space-y-4">
            {newMilestones.map((m, i) => (
              <div key={i} className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    placeholder="Tên milestone (VD: Thiết kế UI)"
                    value={m.title}
                    onChange={(e) => {
                      const newArr = [...newMilestones];
                      newArr[i].title = e.target.value;
                      setNewMilestones(newArr);
                    }}
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-300"
                  />
                  <input
                    type="text"
                    placeholder="Mô tả chi tiết"
                    value={m.description}
                    onChange={(e) => {
                      const newArr = [...newMilestones];
                      newArr[i].description = e.target.value;
                      setNewMilestones(newArr);
                    }}
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-300"
                  />
                  <input
                    type="number"
                    placeholder="Số tiền (VNĐ)"
                    value={m.amount || ""}
                    onChange={(e) => {
                      const newArr = [...newMilestones];
                      newArr[i].amount = Number(e.target.value);
                      setNewMilestones(newArr);
                    }}
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <button
                  onClick={() => setNewMilestones(newMilestones.filter((_, idx) => idx !== i))}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  Xoá
                </button>
              </div>
            ))}
            
            <button
              onClick={() => setNewMilestones([...newMilestones, { title: "", description: "", amount: 0 }])}
              className="text-blue-600 font-medium text-sm"
            >
              + Thêm Milestone
            </button>
            
            <div className="pt-4 border-t">
              <button
                onClick={handleCreateEscrow}
                disabled={actionLoading === "create"}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {actionLoading === "create" ? "Đang xử lý..." : "Tạo & Thanh toán ký quỹ"}
              </button>
            </div>
          </div>
        </div>
      ) : escrow ? (
        <div className="bg-white rounded-2xl border border-blue-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Danh sách Milestones</h2>
              <p className="text-sm text-gray-500">Trạng thái: {escrow.status === EscrowStatus.FUNDED ? "Đã ký quỹ" : escrow.status}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Tổng tiền:</p>
              <p className="text-xl font-bold text-blue-600">{escrow.totalAmount.toLocaleString("vi-VN")}đ</p>
            </div>
          </div>

          <div className="space-y-4">
            {escrow.milestones.map((m) => (
              <div key={m.id} className="p-4 border rounded-xl bg-gray-50/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{m.title} {m.proposedByWorker && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded ml-2">Đề xuất</span>}</h3>
                    <p className="text-sm text-gray-500">{m.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{m.amount.toLocaleString("vi-VN")}đ</p>
                    <div className="mt-1">{getStatusLabel(m.status)}</div>
                  </div>
                </div>

                {/* Worker actions */}
                {isWorker && (m.status === MilestoneStatus.IN_PROGRESS || m.status === MilestoneStatus.REVISION_REQUESTED) && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {m.revisionNote && (
                      <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                        <span className="font-semibold">Yêu cầu sửa:</span> {m.revisionNote}
                      </div>
                    )}
                    <textarea
                      placeholder="Link kết quả công việc hoặc ghi chú nộp bài..."
                      value={submitNotes[m.id] || ""}
                      onChange={(e) => setSubmitNotes({ ...submitNotes, [m.id]: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border focus:ring-blue-300"
                    />
                    <button
                      onClick={() => handleSubmitMilestone(m.id)}
                      disabled={actionLoading === `submit-${m.id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Nộp kết quả
                    </button>
                  </div>
                )}

                {/* Employer actions */}
                {isEmployer && m.status === MilestoneStatus.SUBMITTED && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                      <span className="font-semibold">Worker nộp:</span> {m.submissionNote || "Không có ghi chú"}
                    </div>
                    <textarea
                      placeholder="Ghi chú đánh giá (nếu yêu cầu sửa)..."
                      value={reviewNotes[m.id] || ""}
                      onChange={(e) => setReviewNotes({ ...reviewNotes, [m.id]: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border focus:ring-blue-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewMilestone(m.id, 'approve')}
                        disabled={actionLoading === `review-${m.id}`}
                        className="flex-1 py-2 bg-emerald-500 text-white text-sm rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
                      >
                        Duyệt Milestone
                      </button>
                      <button
                        onClick={() => handleReviewMilestone(m.id, 'request_revision')}
                        disabled={actionLoading === `review-${m.id}` || !reviewNotes[m.id]}
                        className="flex-1 py-2 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-200 hover:bg-red-100 disabled:opacity-50"
                      >
                        Yêu cầu sửa
                      </button>
                    </div>
                  </div>
                )}

                {/* Employer responds to proposal */}
                {isEmployer && m.proposedByWorker && !m.proposalAccepted && (
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <button
                      onClick={() => handleRespondProposal(m.id, true)}
                      className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg font-medium hover:bg-emerald-600"
                    >Chấp nhận đề xuất</button>
                    <button
                      onClick={() => handleRespondProposal(m.id, false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-300"
                    >Từ chối</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {isWorker && (escrow.status === EscrowStatus.FUNDED || escrow.status === EscrowStatus.PARTIALLY_RELEASED) && (
            <div className="mt-6 border-t pt-4">
              {!showPropose ? (
                <button
                  onClick={() => setShowPropose(true)}
                  className="text-blue-600 font-medium text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Đề xuất thêm Milestone
                </button>
              ) : (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                  <h4 className="font-medium text-sm text-gray-900">Đề xuất Milestone</h4>
                  <input
                    type="text" placeholder="Tên milestone"
                    value={proposal.title} onChange={e => setProposal({...proposal, title: e.target.value})}
                    className="w-full px-3 py-2 text-sm rounded-lg border"
                  />
                  <input
                    type="text" placeholder="Mô tả"
                    value={proposal.description} onChange={e => setProposal({...proposal, description: e.target.value})}
                    className="w-full px-3 py-2 text-sm rounded-lg border"
                  />
                  <input
                    type="number" placeholder="Số tiền"
                    value={proposal.amount || ""} onChange={e => setProposal({...proposal, amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 text-sm rounded-lg border"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleProposeMilestone}
                      disabled={actionLoading === "propose"}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
                    >Gửi đề xuất</button>
                    <button onClick={() => setShowPropose(false)} className="px-4 py-2 bg-gray-200 text-sm rounded-lg">Huỷ</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
