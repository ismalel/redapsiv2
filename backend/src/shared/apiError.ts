export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;

  constructor(statusCode: number, message: string, code: string, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  public static badRequest(message: string, code = 'BAD_REQUEST', details: any = null) {
    return new ApiError(400, message, code, details);
  }

  public static unauthorized(message: string, code = 'UNAUTHORIZED', details: any = null) {
    return new ApiError(401, message, code, details);
  }

  public static forbidden(message: string, code = 'FORBIDDEN', details: any = null) {
    return new ApiError(403, message, code, details);
  }

  public static notebook(message: string, code = 'NOT_FOUND', details: any = null) {
    return new ApiError(404, message, code, details);
  }

  public static conflict(message: string, code = 'CONFLICT', details: any = null) {
    return new ApiError(409, message, code, details);
  }

  public static unprocessableEntity(message: string, code = 'UNPROCESSABLE_ENTITY', details: any = null) {
    return new ApiError(422, message, code, details);
  }

  public static internal(message: string, code = 'INTERNAL_SERVER_ERROR', details: any = null) {
    return new ApiError(500, message, code, details);
  }
}
