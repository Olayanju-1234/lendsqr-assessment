import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/http-error";
import { errorResponse } from "../utils/response";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json(errorResponse("Internal server error"));
}
