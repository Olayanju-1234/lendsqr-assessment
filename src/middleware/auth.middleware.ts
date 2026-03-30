import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";
import { HttpError } from "../utils/http-error";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication required");
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}
