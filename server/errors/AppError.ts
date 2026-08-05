export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}
