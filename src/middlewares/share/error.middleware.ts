import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../errors/apiError/api-error";
import { JwtError } from "../../errors/jwt/jwt-error";

export const errorMiddleware = (
  err: Error | ApiError | JwtError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("ERROR:", err);
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  else if(err instanceof JwtError){
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      code: err.code,
    });
  }
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
