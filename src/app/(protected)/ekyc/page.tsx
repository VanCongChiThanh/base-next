"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AuthGuard } from "@/components";
import { EkycWidget } from "@/components/common/ekyc-widget";
import { useAuth } from "@/contexts";
import { getErrorMessage } from "@/lib";
import { ekycService } from "@/services";
import { CompleteEkycVerificationRequest } from "@/types";
import { ApiError, VnptEkycResult } from "@/types";

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function decodeBase64Json(
  dataBase64: string,
): Record<string, unknown> | undefined {
  try {
    const binaryString = atob(dataBase64);
    const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
    const decodedJson = new TextDecoder().decode(bytes);
    return JSON.parse(decodedJson) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function extractOcrSource(result: VnptEkycResult): Record<string, unknown> {
  if (result.ocr && typeof result.ocr === "object") {
    return result.ocr;
  }

  if (result.object && typeof result.object === "object") {
    return result.object;
  }

  const signaturePayload = findOcrSignaturePayload(result);
  if (signaturePayload?.dataBase64) {
    const decodedPayload = decodeBase64Json(signaturePayload.dataBase64);
    const decodedObject = decodedPayload?.object;

    if (decodedObject && typeof decodedObject === "object") {
      return decodedObject as Record<string, unknown>;
    }
  }

  return {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function findAllSignaturePayloads(
  input: unknown,
  depth = 0,
): CompleteEkycVerificationRequest[] {
  if (depth > 10) {
    return [];
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input) as unknown;
      return findAllSignaturePayloads(parsed, depth + 1);
    } catch {
      return [];
    }
  }

  if (!isRecord(input)) {
    return [];
  }

  const results: CompleteEkycVerificationRequest[] = [];

  const dataSign = asString(input.dataSign);
  const dataBase64 = asString(input.dataBase64);

  if (dataSign && dataBase64) {
    results.push({ dataSign, dataBase64 });
  }

  for (const value of Object.values(input)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        results.push(...findAllSignaturePayloads(child, depth + 1));
      }
      continue;
    }

    results.push(...findAllSignaturePayloads(value, depth + 1));
  }

  return results;
}

function findOcrSignaturePayload(
  input: unknown,
): CompleteEkycVerificationRequest | null {
  const allPayloads = findAllSignaturePayloads(input);
  
  // Prefer payload that has 'name' and 'id' (which is the OCR result)
  for (const payload of allPayloads) {
    const decoded = decodeBase64Json(payload.dataBase64);
    if (decoded?.object && (decoded.object as Record<string, unknown>).name) {
      return payload;
    }
  }

  // Fallback to the last available payload if none explicitly match OCR
  return allPayloads.length > 0 ? allPayloads[allPayloads.length - 1] : null;
}

function enrichResultFromSignature(result: VnptEkycResult): VnptEkycResult {
  const signaturePayload = findOcrSignaturePayload(result);
  if (!signaturePayload) {
    return result;
  }

  const decodedPayload = decodeBase64Json(signaturePayload.dataBase64);
  if (!decodedPayload) {
    return {
      ...result,
      dataSign: signaturePayload.dataSign,
      dataBase64: signaturePayload.dataBase64,
    };
  }

  return {
    ...result,
    ...decodedPayload,
    dataSign: signaturePayload.dataSign,
    dataBase64: signaturePayload.dataBase64,
  } as VnptEkycResult;
}

function getResultInfoScore(result: VnptEkycResult | null): number {
  if (!result) {
    return -1;
  }

  const ocrSource = extractOcrSource(result);

  let score = 0;
  if (findOcrSignaturePayload(result)) {
    score += 4;
  }
  if (asString(ocrSource.name) || asString(ocrSource.id)) {
    score += 3;
  }
  if (
    asString((result.compare as Record<string, unknown> | undefined)?.result)
  ) {
    score += 2;
  }
  if (
    asString((result.object as Record<string, unknown> | undefined)?.masked)
  ) {
    score += 1;
  }

  return score;
}

function EkycPageContent() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [result, setResult] = useState<VnptEkycResult | null>(null);
  const [flowError, setFlowError] = useState<string>("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSdkFinished, setIsSdkFinished] = useState(false);
  const [finalPayload, setFinalPayload] = useState<VnptEkycResult | null>(null);

  const completedRef = useRef(false);
  // Separate refs for document and final payloads to ensure we have OCR data which contains the ID info
  const documentSignedPayloadRef = useRef<CompleteEkycVerificationRequest | null>(null);
  const latestSignedPayloadRef = useRef<CompleteEkycVerificationRequest | null>(null);

  const summary = useMemo(() => {
    if (!result) {
      return null;
    }

    const ocrSource = extractOcrSource(result);
    // VNPT sometimes masks compare result at root, check both places
    const compareData = (result.compare || ocrSource.compare) as Record<string, unknown> | undefined;

    return {
      fullName: asString(ocrSource.name) || asString(result.name) || "-",
      cardId: asString(ocrSource.id) || asString(result.id) || "-",
      cardType: asString(ocrSource.card_type) || asString(result.card_type) || "-",
      compareResult: asString(compareData?.result) || "-",
    };
  }, [result]);

  const handleSdkEndFlow = (payload: VnptEkycResult) => {
    // Record the payload but do NOT submit yet
    handleResultUpdate(payload);
    setFinalPayload(payload);
    setIsSdkFinished(true);
    setFlowError("");
  };

  const handleConfirmAndSave = async () => {
    if (!finalPayload || completedRef.current) {
      return;
    }

    const payload = finalPayload;

    completedRef.current = true;
    setFlowError("");
    setResult(payload);
    setIsCompleting(true);

    try {
      // Prioritize the document signature because the backend needs OCR data (ID, name, etc.)
      const signaturePayload =
        documentSignedPayloadRef.current ||
        findOcrSignaturePayload(payload) ||
        latestSignedPayloadRef.current;

      if (!signaturePayload) {
        throw {
          success: false,
          statusCode: 400,
          errorCode: "EKYC_RESULT_MISSING_SIGNATURE",
          message:
            "SDK callback chưa chứa dataSign/dataBase64. Vui lòng hoàn tất đầy đủ luồng document + face rồi thử lại.",
          timestamp: new Date().toISOString(),
        } as ApiError;
      }

      latestSignedPayloadRef.current = signaturePayload;

      const completion = await ekycService.completeVerification({
        dataBase64: signaturePayload.dataBase64,
        dataSign: signaturePayload.dataSign,
        responseData: decodeBase64Json(signaturePayload.dataBase64),
      });

      if (isRecord(completion.decodedPayload)) {
        const mergedResult = {
          ...payload,
          ...completion.decodedPayload,
          dataSign: signaturePayload.dataSign,
          dataBase64: signaturePayload.dataBase64,
        } as VnptEkycResult;

        const enrichedResult = enrichResultFromSignature(mergedResult);
        // Luôn set kết quả cuối cùng từ backend là ground-truth
        setResult(enrichedResult);
      }

      await refreshUser();
      setIsSuccess(true);

      // Cho phép người dùng dừng lại xem tóm tắt thay vì tự động chuyển trang
      // router.replace(...) bị xóa
    } catch (error) {
      completedRef.current = false;
      setFlowError(
        getErrorMessage(error as ApiError) ||
          "Không thể hoàn tất xác thực eKYC. Vui lòng thử lại.",
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleResultUpdate = (payload: VnptEkycResult) => {
    const signaturePayload = findOcrSignaturePayload(payload);
    if (signaturePayload) {
      latestSignedPayloadRef.current = signaturePayload;
    }

    const enrichedPayload = enrichResultFromSignature(payload);

    setResult((currentResult) => {
      const currentScore = getResultInfoScore(currentResult);
      const nextScore = getResultInfoScore(enrichedPayload);

      return nextScore >= currentScore ? enrichedPayload : currentResult;
    });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <span aria-hidden="true">←</span>
            Trở lại
          </Link>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            eKYC bảo mật
          </span>
        </div>

        <section className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
            Xác thực danh tính eKYC
          </h1>
          <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
            Hoàn tất giấy tờ và khuôn mặt trên một màn hình. Khi thành công hệ
            thống sẽ tự quay lại trang hồ sơ và cập nhật trạng thái xác thực.
          </p>
        </section>

        {flowError && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 sm:text-sm">
            {flowError}
          </div>
        )}

        {isSuccess && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-emerald-800">
                Xác thực thành công và thông tin đã được lưu trong hệ thống.
              </span>
            </div>
            <Link
              href="/profile"
              className="whitespace-nowrap rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
            >
              Trở về hồ sơ cá nhân
            </Link>
          </div>
        )}

        <div className="relative">
          {isCompleting && !isSuccess && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:text-sm">
                Đang xác thực và lưu trạng thái...
              </div>
            </div>
          )}

          {!isSuccess && (
            <>
              <EkycWidget
                showDefaultResult
                continueToFaceAfterDocument
                onResult={(payload) => {
                  const signature = findOcrSignaturePayload(payload);
                  if (signature) {
                    // Cập nhật giá trị một cách an toàn nhất
                    const decoded = decodeBase64Json(signature.dataBase64);
                    if (decoded?.object && (decoded.object as any).name) {
                      documentSignedPayloadRef.current = signature;
                    }
                    latestSignedPayloadRef.current = signature;
                  }
                }}
                onAfterEndFlow={(payload) => {
                  const signature = findOcrSignaturePayload(payload);
                  if (signature) {
                    const decoded = decodeBase64Json(signature.dataBase64);
                    if (decoded?.object && (decoded.object as any).name) {
                      documentSignedPayloadRef.current = signature;
                    }
                    latestSignedPayloadRef.current = signature;
                  }
                  setFinalPayload(payload);
                  setIsSdkFinished(true);
                  setFlowError("");
                }}
                onError={(message) => setFlowError(message)}
              />

              {isSdkFinished && finalPayload && (
                <div className="mt-4 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-slate-600">
                    Bạn đã hoàn thành các bước quét. Hãy nhấn xác nhận để lưu kết quả.
                  </p>
                  <button
                    type="button"
                    onClick={handleConfirmAndSave}
                    disabled={isCompleting}
                    className="whitespace-nowrap px-6 py-2.5 bg-blue-600 font-semibold text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow"
                  >
                    {isCompleting ? "Đang lưu..." : "Xác nhận và Lưu hồ sơ"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function EkycPage() {
  return (
    <AuthGuard>
      <EkycPageContent />
    </AuthGuard>
  );
}
