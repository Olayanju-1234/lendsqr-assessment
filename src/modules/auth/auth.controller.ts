import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { successResponse } from "../../utils/response";

export class AuthController {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService = authService || new AuthService();
  }

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(successResponse(result, "User registered successfully"));
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json(successResponse(result, "Login successful"));
    } catch (error) {
      next(error);
    }
  };
}
