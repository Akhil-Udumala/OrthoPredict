export type FrontendErrorKind =
  | "frontend_asset"
  | "api_404"
  | "schema_mismatch"
  | "network"
  | "server"
  | "unknown";

export class FrontendError extends Error {
  kind: FrontendErrorKind;
  url?: string;
  status?: number;
  details?: string;

  constructor(
    kind: FrontendErrorKind,
    message: string,
    options?: { url?: string; status?: number; details?: string },
  ) {
    super(message);
    this.kind = kind;
    this.name = "FrontendError";
    this.url = options?.url;
    this.status = options?.status;
    this.details = options?.details;
  }
}

