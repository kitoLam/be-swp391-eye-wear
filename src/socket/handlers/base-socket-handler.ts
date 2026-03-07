
export abstract class BaseSocketHandler {
  abstract registerHandler() : void;
  abstract initHandler() : void;
  abstract endHandler() : void;
}