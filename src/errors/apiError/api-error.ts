enum StatusCode{
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.1
   *
   * This response means that server could not understand the request due to invalid syntax, not pass validation 
   */
  BAD_REQUEST = 400,
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7235#section-3.1
   *
   * Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate itself to get the requested response (example: not login)
   */
  UNAUTHORIZED = 401,
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.3
   *
   * The client does not have access rights to the content, i.e. they are unauthorized, so server is rejecting to give proper response. Unlike 401, the client's identity is known to the server (not have permission)
   */
  FORBIDDEN = 403,
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.4
   *
   * The server can not find requested resource. In the browser, this means the URL is not recognized. In an API, this can also mean that the endpoint is valid but the resource itself does not exist. Servers may also send this response instead of 403 to hide the existence of a resource from an unauthorized client. This response code is probably the most famous one due to its frequent occurrence on the web.
   */
  NOT_FOUND = 404,
  /**
   * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.8
   *
   * This response is sent when a request conflicts with the current state of the server. (Khi tạo hay cập nhật bị xung đột dữ liệu như đã tồn tại!)
   */
  CONFLICT = 409,
}

enum MessageError{
  BAD_REQUEST = "You sent a bad request",
  UNAUTHORIZED = "Please login to access the system",
  FORBIDDEN = "You do not have permission to access the system",
  NOT_FOUND = "Resources are not found",
  CONFLICT = "Your request is conflict with server resources",
}

class ApiError extends Error{
  statusCode: number;
  success: boolean;
  constructor(message: string, statusCode = 500){
    super(message);
    this.success = false;
    this.statusCode = statusCode;
  }
}

class UnauthorizedRequestError extends ApiError{
  constructor(message: string = MessageError.UNAUTHORIZED){
    super(message, StatusCode.UNAUTHORIZED);
  }
}
class BadRequestError extends ApiError{
  constructor(message: string = MessageError.BAD_REQUEST){
    super(message, StatusCode.BAD_REQUEST);
  }
}
class ConflictRequestError extends ApiError{
  constructor(message: string = MessageError.CONFLICT){
    super(message, StatusCode.CONFLICT);
  }
}
class NotFoundRequestError extends ApiError{
  constructor(message: string = MessageError.NOT_FOUND){
    super(message, StatusCode.NOT_FOUND);
  }
}
class ForbiddenRequestError extends ApiError{
  constructor(message: string = MessageError.FORBIDDEN){
    super(message, StatusCode.FORBIDDEN);
  }
}
export {
  ApiError,
  UnauthorizedRequestError,
  BadRequestError,
  ConflictRequestError,
  NotFoundRequestError,
  ForbiddenRequestError
};
