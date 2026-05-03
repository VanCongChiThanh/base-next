"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FaqNode,
  FaqNodeType,
  SyncTarget,
  deleteFaqNode,
  listFaqNodes,
  triggerSelectiveSync,
  upsertFaqNode,
} from "@/services/ai.service";

// ─── constants ────────────────────────────────────────────────────────────────

const NODE_TYPE_LABELS: Record<FaqNodeType, string> = {
  faq: "FAQ",
  guide: "Hướng dẫn",
  policy: "Chính sách",
  safety: "An toàn",
  general: "Chung",
};

const NODE_TYPE_COLORS: Record<FaqNodeType, string> = {
  faq: "bg-blue-100 text-blue-700",
  guide: "bg-green-100 text-green-700",
  policy: "bg-purple-100 text-purple-700",
  safety: "bg-orange-100 text-orange-700",
  general: "bg-gray-100 text-gray-600",
};

const SYNC_TARGET_LABELS: Record<SyncTarget, string> = {
  jobs: "Việc làm",
  workers: "Người lao động",
  faq: "FAQ / Hướng dẫn",
};

// ─── sub-components ───────────────────────────────────────────────────────────

function Badge({
  nodeType,
}: {
  nodeType: FaqNodeType;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${NODE_TYPE_COLORS[nodeType]}`}
    >
      {NODE_TYPE_LABELS[nodeType]}
    </span>
  );
}

function EmbeddingDot({ has }: { has: boolean }) {
  return (
    <span
      title={has ? "Đã nhúng vector" : "Chưa có embedding"}
      className={`inline-block w-2.5 h-2.5 rounded-full ${has ? "bg-green-500" : "bg-red-400"}`}
    />
  );
}

// ─── FAQ modal ────────────────────────────────────────────────────────────────

interface FaqModalProps {
  initialData: Partial<FaqNode> | null;
  onClose: () => void;
  onSaved: () => void;
}

function FaqModal({ initialData, onClose, onSaved }: FaqModalProps) {
  const [nodeType, setNodeType] = useState<FaqNodeType>(
    (initialData?.nodeType as FaqNodeType) ?? "faq"
  );
  const [title, setTitle] = useState(initialData?.title ?? "");
  // strip the title prefix that backend prepends to content
  const rawContent = initialData?.content ?? "";
  const prefixToStrip = initialData?.title ? initialData.title + "\n" : "";
  const [content, setContent] = useState(
    prefixToStrip && rawContent.startsWith(prefixToStrip)
      ? rawContent.slice(prefixToStrip.length)
      : rawContent
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Vui lòng điền đầy đủ tiêu đề và nội dung.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await upsertFaqNode({
        id: initialData?.id,
        nodeType,
        title: title.trim(),
        content: content.trim(),
      });
      onSaved();
    } catch {
      setError("Lưu thất bại, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-800">
            {initialData?.id ? "Chỉnh sửa mục" : "Thêm mục mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as FaqNodeType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(Object.keys(NODE_TYPE_LABELS) as FaqNodeType[]).map((t) => (
                <option key={t} value={t}>
                  {NODE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-gray-400 font-normal text-xs">(tối đa 300 ký tự)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              placeholder="VD: Cách tạo tài khoản trên GigWork"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung <span className="text-gray-400 font-normal text-xs">(tối đa 5 000 ký tự)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={7}
              placeholder="Mô tả chi tiết…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">{content.length} / 5 000</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirmation ───────────────────────────────────────────────────────

function DeleteConfirm({
  node,
  onClose,
  onDeleted,
}: {
  node: FaqNode;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteFaqNode(node.id);
      onDeleted();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Xác nhận xóa</h3>
        <p className="text-sm text-gray-600 mb-6">
          Bạn có chắc muốn xóa mục <span className="font-medium">"{node.title}"</span> không? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Đang xóa…" : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAiPage() {
  // FAQ state
  const [faqNodes, setFaqNodes] = useState<FaqNode[]>([]);
  const [loadingFaq, setLoadingFaq] = useState(true);
  const [filterType, setFilterType] = useState<FaqNodeType | "all">("all");
  const [searchQ, setSearchQ] = useState("");

  // modal state
  const [editTarget, setEditTarget] = useState<Partial<FaqNode> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FaqNode | null>(null);

  // sync state
  const [selectedTargets, setSelectedTargets] = useState<Set<SyncTarget>>(
    new Set(["jobs", "workers", "faq"])
  );
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadFaq = useCallback(async () => {
    setLoadingFaq(true);
    try {
      const data = await listFaqNodes();
      setFaqNodes(data);
    } catch {
      // ignore
    } finally {
      setLoadingFaq(false);
    }
  }, []);

  useEffect(() => {
    loadFaq();
  }, [loadFaq]);

  function toggleTarget(t: SyncTarget) {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  async function handleSync() {
    if (selectedTargets.size === 0) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await triggerSelectiveSync([...selectedTargets]);
      toast.success(res.message);
      setSyncMsg({
        ok: true,
        text: "Đang xử lý nền — bạn sẽ nhận thông báo hệ thống khi hoàn tất.",
      });
    } catch (e: unknown) {
      const errMsg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Đồng bộ thất bại, vui lòng thử lại.";
      toast.error(errMsg);
      setSyncMsg({ ok: false, text: errMsg });
    } finally {
      setSyncing(false);
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => setSyncMsg(null), 8000);
    }
  }

  const displayedNodes = faqNodes.filter((n) => {
    if (!n.isActive) return false;
    if (filterType !== "all" && n.nodeType !== filterType) return false;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: faqNodes.filter((n) => n.isActive).length,
    embedded: faqNodes.filter((n) => n.isActive && n.hasEmbedding).length,
    byType: (Object.keys(NODE_TYPE_LABELS) as FaqNodeType[]).map((t) => ({
      type: t,
      count: faqNodes.filter((n) => n.isActive && n.nodeType === t).length,
    })),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý AI & Đồng bộ</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý knowledge base chatbot và kích hoạt đồng bộ vector embedding
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tổng mục</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Đã embedding</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900">{stats.embedded}</p>
            {stats.total > 0 && (
              <p className="text-sm text-gray-400 mb-0.5">
                / {stats.total}
              </p>
            )}
          </div>
        </div>
        {stats.byType.slice(0, 2).map(({ type, count }) => (
          <div key={type} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {NODE_TYPE_LABELS[type]}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
          </div>
        ))}
      </div>

      {/* Sync panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Đồng bộ dữ liệu AI
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Chọn loại dữ liệu cần đồng bộ vào vector database để chatbot có thể tìm kiếm.
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          {(["jobs", "workers", "faq"] as SyncTarget[]).map((t) => (
            <label
              key={t}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-colors select-none ${
                selectedTargets.has(t)
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedTargets.has(t)}
                onChange={() => toggleTarget(t)}
              />
              <span
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selectedTargets.has(t) ? "border-blue-500 bg-blue-500" : "border-gray-400"
                }`}
              >
                {selectedTargets.has(t) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </span>
              <span className="text-sm font-medium">{SYNC_TARGET_LABELS[t]}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSync}
            disabled={syncing || selectedTargets.size === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {syncing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang đồng bộ…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Bắt đầu đồng bộ ({selectedTargets.size} mục)
              </>
            )}
          </button>

          {syncMsg && (
            <span
              className={`text-sm font-medium ${syncMsg.ok ? "text-green-600" : "text-red-600"}`}
            >
              {syncMsg.ok ? "✅" : "❌"} {syncMsg.text}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Cron job tự động đồng bộ <strong>Việc làm + Người lao động</strong> mỗi giờ.
          FAQ / Hướng dẫn chỉ đồng bộ khi bạn chủ động bấm nút.
        </p>
      </div>

      {/* FAQ Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Knowledge Base — FAQ & Hướng dẫn
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>

            {/* filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FaqNodeType | "all")}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả loại</option>
              {(Object.keys(NODE_TYPE_LABELS) as FaqNodeType[]).map((t) => (
                <option key={t} value={t}>{NODE_TYPE_LABELS[t]}</option>
              ))}
            </select>

            {/* add button */}
            <button
              onClick={() => { setEditTarget({}); setShowModal(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Thêm mới
            </button>
          </div>
        </div>

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Loại</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tiêu đề</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Nội dung</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vector</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingFaq ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    <svg className="w-5 h-5 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang tải…
                  </td>
                </tr>
              ) : displayedNodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    Không có mục nào
                  </td>
                </tr>
              ) : (
                displayedNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Badge nodeType={node.nodeType as FaqNodeType} />
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="font-medium text-gray-800 truncate">{node.title}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell max-w-sm">
                      <p className="text-gray-500 text-xs line-clamp-2 whitespace-pre-wrap">
                        {node.content.startsWith(node.title + "\n")
                          ? node.content.slice(node.title.length + 1)
                          : node.content}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <EmbeddingDot has={node.hasEmbedding} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditTarget(node); setShowModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(node)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loadingFaq && displayedNodes.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            Hiển thị {displayedNodes.length} / {faqNodes.filter((n) => n.isActive).length} mục •{" "}
            <span className="text-green-600">{stats.embedded} đã embedding</span>
            {stats.total - stats.embedded > 0 && (
              <> • <span className="text-red-500">{stats.total - stats.embedded} chưa embedding — hãy chạy đồng bộ FAQ</span></>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && editTarget !== null && (
        <FaqModal
          initialData={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={() => { setShowModal(false); setEditTarget(null); loadFaq(); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          node={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); loadFaq(); }}
        />
      )}
    </div>
  );
}
