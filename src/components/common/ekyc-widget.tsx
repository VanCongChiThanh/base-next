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

const VNPT_DEPENDENCY_SCRIPT_CANDIDATES = {
  vnpt_lottie: [
    "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.4/lottie.min.js",
  ],
  oval_custom: ["https://ekyc-web.vnpt.vn/lib/VNPTBrowserSDKAppV2.3.3.js"],
  vnpt_jsqr: ["https://ekyc-web.vnpt.vn/lib/jsQR.js"],
} as const;

const DEFAULT_INIT_CONFIG: Partial<VnptEkycInitConfig> = {
  FLOW_TAKEN: "DOCUMENT",
  HAS_RESULT_SCREEN: false,
  CHECK_LIVENESS_CARD: true,
  CHECK_LIVENESS_FACE: true,
  CHECK_MASKED_FACE: true,
  COMPARE_FACE: true,
  DEFAULT_LANGUAGE: "vi",
  LIST_TYPE_DOCUMENT: [-1, 5, 6, 7, 9],
  DOCUMENT_TYPE_START: 999,
};

const SDK_SCRIPT_CANDIDATES = ["/vendor/web-sdk-version-3.0.js"];

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

        let authToken: string | undefined;
        if (!sdkConfig.ENABLE_GGCAPCHAR) {
          const accessToken = await ekycService.getAccessToken();
          authToken = accessToken.accessToken;
        } else {
          try {
            const accessToken = await ekycService.getAccessToken();
            authToken = accessToken.accessToken;
          } catch {
            // Optional when Google captcha mode is enabled by VNPT.
            authToken = undefined;
          }
        }

        const handleResult = (result: VnptEkycResult) => {
          onResult?.(result);
          onAfterEndFlow?.(result);
        };

        const initConfig: VnptEkycInitConfig = {
          ...DEFAULT_INIT_CONFIG,
          ...sdkConfig,
          ...configOverrides,
          ACCESS_TOKEN: authToken,
          HAS_RESULT_SCREEN: showDefaultResult,
          FLOW_TAKEN: continueToFaceAfterDocument ? "DOCUMENT_TO_FACE" : "DOCUMENT",
          CALL_BACK: handleResult,
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

        onError?.(message);
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
    onError,
    onAfterEndFlow,
    onResult,
    parentId,
    retryToken,
    showDefaultResult,
  ]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

      <div id={parentId} className="min-h-[520px] w-full" />
    </div>
  );
}

export default EkycWidget;
