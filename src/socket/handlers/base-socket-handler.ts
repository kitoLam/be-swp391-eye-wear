import { Socket } from "socket.io";

export abstract class BaseSocketHandler {
  abstract registerHandler(socket: Socket) : void;
  abstract initHandler(socket: Socket) : void;
  abstract endHandler(socket: Socket) : void;
}