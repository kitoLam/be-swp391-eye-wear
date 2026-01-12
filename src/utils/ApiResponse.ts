export class ApiResponse {
  static success(message: string, data: unknown) {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, code?: string | number) {
    return {
      success: false,
      message,
      code: code,
    };
  }
}
