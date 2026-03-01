export class RelayError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RelayError";
  }
}

export class RelayAuthError extends RelayError {
  constructor(message = "Invalid or missing API key") {
    super(401, "UNAUTHORIZED", message);
    this.name = "RelayAuthError";
  }
}

export class RelayConnectionError extends RelayError {
  constructor(baseUrl: string, cause?: Error) {
    super(0, "CONNECTION_ERROR", `Failed to connect to relay at ${baseUrl}`);
    this.name = "RelayConnectionError";
    if (cause) this.cause = cause;
  }
}
