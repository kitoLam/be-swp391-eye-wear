"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenRequestError = exports.NotFoundRequestError = exports.ConflictRequestError = exports.BadRequestError = exports.UnauthorizedRequestError = exports.ApiError = void 0;
var StatusCode;
(function (StatusCode) {
    /**
     * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.1
     *
     * This response means that server could not understand the request due to invalid syntax, not pass validation
     */
    StatusCode[StatusCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    /**
     * Official Documentation @ https://tools.ietf.org/html/rfc7235#section-3.1
     *
     * Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate itself to get the requested response (example: not login)
     */
    StatusCode[StatusCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    /**
     * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.3
     *
     * The client does not have access rights to the content, i.e. they are unauthorized, so server is rejecting to give proper response. Unlike 401, the client's identity is known to the server (not have permission)
     */
    StatusCode[StatusCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    /**
     * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.4
     *
     * The server can not find requested resource. In the browser, this means the URL is not recognized. In an API, this can also mean that the endpoint is valid but the resource itself does not exist. Servers may also send this response instead of 403 to hide the existence of a resource from an unauthorized client. This response code is probably the most famous one due to its frequent occurrence on the web.
     */
    StatusCode[StatusCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    /**
     * Official Documentation @ https://tools.ietf.org/html/rfc7231#section-6.5.8
     *
     * This response is sent when a request conflicts with the current state of the server. (Khi tạo hay cập nhật bị xung đột dữ liệu như đã tồn tại!)
     */
    StatusCode[StatusCode["CONFLICT"] = 409] = "CONFLICT";
})(StatusCode || (StatusCode = {}));
var MessageError;
(function (MessageError) {
    MessageError["BAD_REQUEST"] = "You sent a bad request";
    MessageError["UNAUTHORIZED"] = "Please login to access the system";
    MessageError["FORBIDDEN"] = "You do not have permission to access the system";
    MessageError["NOT_FOUND"] = "Resources are not found";
    MessageError["CONFLICT"] = "Your request is conflict with server resources";
})(MessageError || (MessageError = {}));
class ApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.success = false;
        this.statusCode = statusCode;
    }
}
exports.ApiError = ApiError;
class UnauthorizedRequestError extends ApiError {
    constructor(message = MessageError.UNAUTHORIZED) {
        super(message, StatusCode.UNAUTHORIZED);
    }
}
exports.UnauthorizedRequestError = UnauthorizedRequestError;
class BadRequestError extends ApiError {
    constructor(message = MessageError.BAD_REQUEST) {
        super(message, StatusCode.BAD_REQUEST);
    }
}
exports.BadRequestError = BadRequestError;
class ConflictRequestError extends ApiError {
    constructor(message = MessageError.CONFLICT) {
        super(message, StatusCode.CONFLICT);
    }
}
exports.ConflictRequestError = ConflictRequestError;
class NotFoundRequestError extends ApiError {
    constructor(message = MessageError.NOT_FOUND) {
        super(message, StatusCode.NOT_FOUND);
    }
}
exports.NotFoundRequestError = NotFoundRequestError;
class ForbiddenRequestError extends ApiError {
    constructor(message = MessageError.FORBIDDEN) {
        super(message, StatusCode.FORBIDDEN);
    }
}
exports.ForbiddenRequestError = ForbiddenRequestError;
