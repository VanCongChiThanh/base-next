export type EkycFlowType = "DOCUMENT" | "FACE";

export interface VnptSdkStyle {
  [key: string]: string;
}

export interface VnptEkycInitConfig {
  BACKEND_URL: string;
  TOKEN_KEY: string;
  TOKEN_ID: string;
  ACCESS_TOKEN?: string;
  ENABLE_GGCAPCHAR?: boolean;
  HAS_RESULT_SCREEN?: boolean;
  FLOW_TAKEN?: string;
  LIST_TYPE_DOCUMENT?: number[];
  DOCUMENT_TYPE_START?: number;
  CHECK_LIVENESS_CARD?: boolean;
  CHECK_LIVENESS_FACE?: boolean;
  CHECK_MASKED_FACE?: boolean;
  COMPARE_FACE?: boolean;
  CUSTOM_THEME?: Record<string, string>;
  CHALLENGE_CODE?: string;
  SHOW_STEP?: boolean;
  HAS_QR_SCAN?: boolean;
  DEFAULT_LANGUAGE?: "vi" | "en";
  CALL_BACK?: (result: VnptEkycResult) => void;
  // Legacy ones
  AUTHORIZION?: string;
  PARRENT_ID?: string;
  FLOW_TYPE?: EkycFlowType;
  SHOW_RESULT?: boolean;
  SHOW_HELP?: boolean;
  SHOW_TRADEMARK?: boolean;
  LANGUAGE?: "vi" | "en";
  LIST_ITEM?: number[];
  TYPE_DOCUMENT?: number;
  USE_WEBCAM?: boolean;
  USE_UPLOAD?: boolean;
  ADVANCE_LIVENESS_FACE?: boolean;
  LIST_CHOOSE_STYLE?: VnptSdkStyle;
  CAPTURE_IMAGE_STYLE?: VnptSdkStyle;
  RESULT_DEFAULT_STYLE?: VnptSdkStyle;
  MOBILE_STYLE?: VnptSdkStyle;
}

export interface VnptEkycResult {
  type_document: number;
  liveness_card_front?: Record<string, unknown>;
  liveness_card_back?: Record<string, unknown>;
  ocr?: Record<string, unknown>;
  liveness_face?: Record<string, unknown>;
  masked?: Record<string, unknown>;
  hash_img?: Record<string, unknown>;
  compare?: Record<string, unknown>;
  base64_doc_img?: string;
  base64_face_img?: string;
  data_hash_document?: string;
  qr_code?: string;
  [key: string]: unknown;
}

export interface EkycSdkConfigResponse {
  BACKEND_URL: string;
  TOKEN_KEY: string;
  TOKEN_ID: string;
  ENABLE_GGCAPCHAR: boolean;
}

export interface EkycAccessTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number | null;
}

export interface VerifyEkycSignatureRequest {
  dataBase64: string;
  dataSign: string;
  publicKey?: string;
  responseData?: Record<string, unknown>;
}

export interface VerifyEkycSignatureResponse {
  isValidSignature: boolean;
  isPayloadMatched: boolean | null;
  decodedPayload: unknown;
}
