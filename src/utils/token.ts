import jwt from "jsonwebtoken";
import config from "../config";
import { TokenPayload } from "../types";

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
}
