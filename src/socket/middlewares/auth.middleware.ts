import { Socket } from "socket.io/dist/socket";
import { SocketError, UnauthorizedSocketError } from "../../errors/socketError/socket-error";
import { DefaultEventsMap } from "socket.io";
import authService from "../../services/client/auth.service";
import adminAuthService from "../../services/admin/auth.service";
import { ApiError } from "../../errors/apiError/api-error";
import { JwtError } from "../../errors/jwt/jwt-error";
export const authSocketMiddleware = async (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, next: any) => {
    try {
        const authSocket = socket.handshake.auth;
        const token = authSocket.token;
        const userType = authSocket.userType;
        if (!token) throw new UnauthorizedSocketError('INVALID_TOKEN');
        if (userType == 'CUSTOMER' && userType != 'STAFF') {
            throw new UnauthorizedSocketError('INVALID_USER_TYPE');
        }
        const jwtPayload =
            userType == 'CUSTOMER'
                ? await authService.verifyUserByAccessToken(token)
                : await adminAuthService.verifyUserByAccessToken(token);
        socket.user = {
            id: jwtPayload.userId,
            userType: userType,
            role: jwtPayload.role ? jwtPayload.role : null,
        };
        next();
    } catch (error: any) {
        if (error instanceof SocketError) {
            next(error);
        } else if (error instanceof ApiError) {
            const resErr = new SocketError(error.message);
            next(resErr);
        } else if (error instanceof JwtError) {
            const resErr = new SocketError(error.message, error.code);
            next(resErr);
        } else {
            const resErr = new SocketError('Internal socket err');
            next(resErr);
        }
    }
};
