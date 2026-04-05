export type EkycFlowType = "DOCUMENT" | "FACE";
export type EkycFlowTaken = "BOTH" | "DOCUMENT" | "FACE";
export type EkycUseMethod = "BOTH" | "PHOTO" | "UPLOAD";

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
  FLOW_TAKEN?: EkycFlowTaken;
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
  URL_WEB_OVAL?: string;
  URL_MOBILE_OVAL?: string;
  DEFAULT_LANGUAGE?: "vi" | "en";
  USE_METHOD?: EkycUseMethod;
  CALL_BACK?: (result: VnptEkycResult) => void;
  CALL_BACK_END_FLOW?: (result: VnptEkycResult) => void;
  CALL_BACK_DOCUMENT_RESULT?: (result: VnptEkycResult) => void;
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
  orc?: Record<string, unknown>;
  liveness_face?: Record<string, unknown>;
  masked?: Record<string, unknown>;
  hash_img?: Record<string, unknown>;
  compare?: Record<string, unknown>;
  base64_doc_img?: string;
  base64_face_img?: string;
  data_hash_document?: string;
  qr_code?: string;
  qrCode?: string;
  dataSign?: string;
  dataBase64?: string;
  message?: string;
  object?: Record<string, unknown>;
  statusCode?: number;
  challengeCode?: string;
  logID?: string;
  imgs?: Record<string, string>;
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

export interface CompleteEkycVerificationRequest {
  dataBase64: string;
  dataSign: string;
  responseData?: Record<string, unknown>;
}

export interface CompleteEkycVerificationResponse {
  verified: boolean;
  verificationLevel: string;
  isPayloadMatched: boolean | null;
  decodedPayload: unknown;
}
