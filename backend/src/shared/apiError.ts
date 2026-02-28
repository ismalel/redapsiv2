export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown;

  constructor(statusCode: number, message: string, code: string, details: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  public static badRequest(message: string, code = 'BAD_REQUEST', details: unknown = null) {
    return new ApiError(400, message, code, details);
  }

  public static unauthorized(message: string, code = 'UNAUTHORIZED', details: unknown = null) {
    return new ApiError(401, message, code, details);
  }

  public static forbidden(message: string, code = 'FORBIDDEN', details: unknown = null) {
    return new ApiError(403, message, code, details);
  }

  public static notFound(message: string, code = 'NOT_FOUND', details: unknown = null) {
    return new ApiError(404, message, code, details);
  }

  public static conflict(message: string, code = 'CONFLICT', details: unknown = null) {
    return new ApiError(409, message, code, details);
  }

  public static unprocessableEntity(message: string, code = 'UNPROCESSABLE_ENTITY', details: unknown = null) {
    return new ApiError(422, message, code, details);
  }

  public static internal(message: string, code = 'INTERNAL_SERVER_ERROR', details: unknown = null) {
    return new ApiError(500, message, code, details);
  }
}
