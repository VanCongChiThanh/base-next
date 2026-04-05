"use client";

import { useEffect, useRef, useState } from "react";
import { ekycService } from "@/services";
import { ApiError, VnptEkycInitConfig, VnptEkycResult } from "@/types";
import { getErrorMessage } from "@/lib";

declare global {
  interface Window {
    FaceVNPTBrowserSDK?: {
      init: () => Promise<void> | void;
    };
    SDK?: {
      launch: (config: object) => void;
    };
    jsQR?: unknown;
  }
}

interface EkycWidgetProps {
  parentId?: string;
  configOverrides?: Partial<VnptEkycInitConfig>;
  showDefaultResult?: boolean;
  continueToFaceAfterDocument?: boolean;
  onResult?: (result: VnptEkycResult) => void;
  onAfterEndFlow?: (result: VnptEkycResult) => void;
  onError?: (message: string) => void;
}

function buildScriptCandidates(
  ...candidates: Array<string | undefined>
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of candidates) {
    const normalizedCandidate = candidate?.trim();
    if (!normalizedCandidate || seen.has(normalizedCandidate)) {
      continue;
    }

    seen.add(normalizedCandidate);
    result.push(normalizedCandidate);
  }

  return result;
}

const VNPT_DEPENDENCY_SCRIPT_CANDIDATES = {
  vnpt_lottie: buildScriptCandidates(
    "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.4/lottie.min.js",
  ),
  oval_custom: buildScriptCandidates(
    process.env.NEXT_PUBLIC_VNPT_OVAL_SCRIPT_URL,
    "https://ekyc-web.vnpt.vn/lib/VNPTBrowserSDKAppV2.3.3.js",
    "https://ekyc-web.icenter.ai/lib/VNPTBrowserSDKApp.js",
    "/vendor/VNPTBrowserSDKApp.js",
  ),
  vnpt_jsqr: buildScriptCandidates(
    process.env.NEXT_PUBLIC_VNPT_JSQR_SCRIPT_URL,
    "https://ekyc-web.vnpt.vn/lib/jsQR.js",
    "https://ekyc-web.icenter.ai/lib/jsQR.js",
    "/vendor/jsQR.js",
  ),
} as const;

const DEFAULT_INIT_CONFIG: Partial<VnptEkycInitConfig> = {
  FLOW_TAKEN: "DOCUMENT",
  HAS_RESULT_SCREEN: false,
  USE_METHOD: "BOTH",
  ADVANCE_LIVENESS_FACE: true,
  CHECK_LIVENESS_CARD: true,
  CHECK_LIVENESS_FACE: true,
  CHECK_MASKED_FACE: true,
  COMPARE_FACE: true,
  DEFAULT_LANGUAGE: "vi",
  LIST_TYPE_DOCUMENT: [-1, 5, 6, 7, 9],
  DOCUMENT_TYPE_START: 999,
};

const SDK_SCRIPT_CANDIDATES = buildScriptCandidates(
  process.env.NEXT_PUBLIC_VNPT_EKYC_SDK_SCRIPT_URL,
  "/vendor/web-sdk-version-3.0.js",
);

const WEB_OVAL_URL_CANDIDATE =
  process.env.NEXT_PUBLIC_VNPT_WEB_OVAL_URL?.trim();

const MOBILE_OVAL_URL_CANDIDATE =
  process.env.NEXT_PUBLIC_VNPT_MOBILE_OVAL_URL?.trim() ||
  WEB_OVAL_URL_CANDIDATE;

function loadScript(
  id: string,
  src: string,
  globalCheck?: () => boolean,
  isAsync = true,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingElement = document.getElementById(
      id,
    ) as HTMLScriptElement | null;

    if (existingElement) {
      if (!globalCheck || globalCheck()) {
        resolve();
        return;
      }

      // Script tag exists but global is missing -> remove stale tag and reload.
      existingElement.remove();
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = isAsync;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function loadScriptWithFallback(
  id: string,
  candidates: string[],
  globalCheck?: () => boolean,
  isAsync = true,
): Promise<void> {
  let lastError: Error | null = null;

  for (const src of candidates) {
    try {
      await loadScript(id, src, globalCheck, isAsync);
      return;
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError || new Error(`Unable to load script candidates for ${id}`);
}

async function waitForGlobal(
  check: () => boolean,
  timeoutMs = 5000,
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (check()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("VNPT eKYC SDK chưa sẵn sàng");
}

function resolveOverrideToken(
  overrides?: Partial<VnptEkycInitConfig>,
): string | null {
  const token = overrides?.AUTHORIZION || overrides?.ACCESS_TOKEN;
  const normalizedToken = token?.trim();

  return normalizedToken ? normalizedToken : null;
}

function normalizeSdkResult(result: VnptEkycResult): VnptEkycResult {
  const normalizedResult = { ...result };

  if (!normalizedResult.ocr && normalizedResult.orc) {
    normalizedResult.ocr = normalizedResult.orc;
  }

  if (!normalizedResult.qr_code && normalizedResult.qrCode) {
    normalizedResult.qr_code = normalizedResult.qrCode;
  }

  return normalizedResult;
}

export function EkycWidget({
  parentId = "ekyc_sdk_intergrated",
  configOverrides,
  showDefaultResult = true,
  continueToFaceAfterDocument = false,
  onResult,
  onAfterEndFlow,
  onError,
}: EkycWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const initializedRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onAfterEndFlowRef = useRef(onAfterEndFlow);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onAfterEndFlowRef.current = onAfterEndFlow;
  }, [onAfterEndFlow]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let isUnmounted = false;

    const setupEkyc = async () => {
      try {
        setError(null);
        setIsLoading(true);

        // Keep strict load order like VNPT's HTML integration sample.
        await loadScriptWithFallback(
          "vnpt_lottie",
          [...VNPT_DEPENDENCY_SCRIPT_CANDIDATES.vnpt_lottie],
          undefined,
          false,
        );
        await loadScriptWithFallback(
          "oval_custom",
          [...VNPT_DEPENDENCY_SCRIPT_CANDIDATES.oval_custom],
          () => Boolean(window.FaceVNPTBrowserSDK),
          false,
        );
        await loadScriptWithFallback(
          "vnpt_jsqr",
          [...VNPT_DEPENDENCY_SCRIPT_CANDIDATES.vnpt_jsqr],
          () => Boolean(window.jsQR),
          false,
        );

        await loadScriptWithFallback(
          "vnpt_ekyc_sdk",
          SDK_SCRIPT_CANDIDATES,
          () => Boolean(window.SDK),
          false,
        );

        await waitForGlobal(() => Boolean(window.FaceVNPTBrowserSDK));
        await waitForGlobal(() => Boolean(window.SDK));

        if (!window.FaceVNPTBrowserSDK || !window.SDK) {
          throw new Error(
            "VNPT eKYC SDK chưa sẵn sàng. Vui lòng kiểm tra cấu hình URL SDK hoặc kết nối mạng.",
          );
        }

        if (window.FaceVNPTBrowserSDK.init) {
          await window.FaceVNPTBrowserSDK.init();
        }

        const sdkConfig = await ekycService.getSdkConfig();

        let authToken = resolveOverrideToken(configOverrides);

        if (!authToken) {
          const accessToken = await ekycService.getAccessToken();
          authToken = accessToken.accessToken?.trim();
        }

        if (!authToken) {
          throw new Error(
            "Không lấy được access token từ backend. Vui lòng kiểm tra endpoint /ekyc/access-token và biến VNPT_EKYC_* trong backend.",
          );
        }

        const handleResult = (result: VnptEkycResult) => {
          const normalizedResult = normalizeSdkResult(result);
          onResultRef.current?.(normalizedResult);
        };

        const handleEndFlowResult = (result: VnptEkycResult) => {
          const normalizedResult = normalizeSdkResult(result);
          onResultRef.current?.(normalizedResult);
          onAfterEndFlowRef.current?.(normalizedResult);
        };

        const handleDocumentResult = (result: VnptEkycResult) => {
          const normalizedResult = normalizeSdkResult(result);
          
          // ─── Lọc ảnh mờ/lé ngay lập tức trên Frontend ───
          const ocr = (normalizedResult.ocr || normalizedResult.object) as Record<string, any>;
          if (ocr) {
            const warningMsg = String(ocr.warning_msg || "").toLowerCase();
            const qFront = ocr.quality_front?.final_result;
            const qBack = ocr.quality_back?.final_result;

            if (
              warningMsg.includes("mờ") || 
              warningMsg.includes("chói") ||
              warningMsg.includes("lóa") ||
              qFront?.blurred_likelihood === "likely" ||
              qBack?.blurred_likelihood === "likely" ||
              qFront?.bad_luminance_likelihood === "likely" ||
              qBack?.bad_luminance_likelihood === "likely"
            ) {
              const msg = "Ảnh giấy tờ bị mờ, lóa hoặc thiếu sáng. Vui lòng chụp lại hình ảnh rõ nét hơn!";
              if (!isUnmounted) {
                setError(msg);
                setIsLoading(false);
                initializedRef.current = false;
                
                // Cleanup current SDK container to stop the flow
                const sdkContainer = document.getElementById(parentId);
                if (sdkContainer) {
                   sdkContainer.innerHTML = "";
                }
              }
              onErrorRef.current?.(msg);
              return; // Chặn không truyền tiếp data
            }
          }

          onResultRef.current?.(normalizedResult);
        };

        const initConfig: VnptEkycInitConfig = {
          ...DEFAULT_INIT_CONFIG,
          ...sdkConfig,
          ...configOverrides,
          PARRENT_ID: parentId,
          AUTHORIZION: authToken,
          ACCESS_TOKEN: authToken,
          ...(configOverrides?.URL_WEB_OVAL || WEB_OVAL_URL_CANDIDATE
            ? {
                URL_WEB_OVAL:
                  configOverrides?.URL_WEB_OVAL || WEB_OVAL_URL_CANDIDATE,
              }
            : {}),
          ...(configOverrides?.URL_MOBILE_OVAL || MOBILE_OVAL_URL_CANDIDATE
            ? {
                URL_MOBILE_OVAL:
                  configOverrides?.URL_MOBILE_OVAL || MOBILE_OVAL_URL_CANDIDATE,
              }
            : {}),
          HAS_RESULT_SCREEN: showDefaultResult,
          FLOW_TAKEN: continueToFaceAfterDocument ? "BOTH" : "DOCUMENT",
          CALL_BACK: handleResult,
          CALL_BACK_END_FLOW: handleEndFlowResult,
          CALL_BACK_DOCUMENT_RESULT: handleDocumentResult,
        } as VnptEkycInitConfig;

        window.SDK.launch(initConfig);

        if (!isUnmounted) {
          initializedRef.current = true;
          setIsLoading(false);
        }
      } catch (err) {
        const rawMessage =
          err instanceof Error
            ? err.message
            : getErrorMessage(err as ApiError) || "Không thể khởi tạo eKYC";
        let message = rawMessage;
        if (rawMessage.includes("VNPTBrowserSDKApp.js")) {
          message =
            "Không tải được VNPTBrowserSDKApp.js (thường do lỗi chứng chỉ SSL). Hãy đặt file vào public/vendor/VNPTBrowserSDKApp.js hoặc cấu hình NEXT_PUBLIC_VNPT_OVAL_SCRIPT_URL.";
        } else if (rawMessage.includes("jsQR.js")) {
          message =
            "Không tải được jsQR.js. Hãy đặt file vào public/vendor/jsQR.js hoặc cấu hình NEXT_PUBLIC_VNPT_JSQR_SCRIPT_URL.";
        } else if (rawMessage.includes("Unable to load script")) {
          message =
            "Không thể tải SDK eKYC từ VNPT. Vui lòng kiểm tra mạng/VPN hoặc cấu hình đường dẫn SDK.";
        }

        if (!isUnmounted) {
          setError(message);
          setIsLoading(false);
        }

        onErrorRef.current?.(message);
      }
    };

    if (!initializedRef.current) {
      void setupEkyc();
    }

    return () => {
      isUnmounted = true;
      const sdkContainer = document.getElementById("vnpt_ekyc");
      if (sdkContainer?.parentNode) {
        sdkContainer.parentNode.removeChild(sdkContainer);
      }
    };
  }, [
    configOverrides,
    continueToFaceAfterDocument,
    parentId,
    retryToken,
    showDefaultResult,
  ]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      {isLoading && (
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          Đang tải VNPT eKYC SDK...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              initializedRef.current = false;
              setRetryToken((prev) => prev + 1);
            }}
            className="mt-2 inline-flex rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      )}

      <div id={parentId} className="min-h-[440px] w-full sm:min-h-[520px]" />
    </div>
  );
}

export default EkycWidget;
