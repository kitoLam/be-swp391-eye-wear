
class SocketError extends Error{
  data: {
    success: boolean,
    code?: string,
    message: string,
  }
  constructor(message: string, code: string = 'INTERNAL_SOCKET_ERROR') {
    super(message);
    this.data = {
      success: false,
      code,
      message: message
    }
  }
}
class UnauthorizedSocketError extends SocketError{
  constructor(message: string, code: string = 'UNAUTHORIZED') {
    super(message, code);
  }
}
class SocketResourceNotFoundError extends SocketError {
  constructor(message: string, code: string = 'RESOURCE_NOT_FOUND') {
    super(message, code);
  }
}
class SocketNotSupportEventListener extends SocketError{
  constructor(message: string, code: string = 'NOT_SUPPORT_EVENT_LISTENER') {
    super(message, code);
  }
}
class SocketUserNotGrantPermissionError extends SocketError{
  constructor(message: string, code: string = 'USER_NOT_GRANT_PERMISSION') {
    super(message, code);
  }
}
export { SocketError, UnauthorizedSocketError, SocketResourceNotFoundError, SocketNotSupportEventListener, SocketUserNotGrantPermissionError };