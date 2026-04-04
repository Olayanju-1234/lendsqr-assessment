import { Request, Response, NextFunction } from "express";
import { WalletService } from "./wallet.service";
import { successResponse } from "../../utils/response";

export class WalletController {
  private walletService: WalletService;

  constructor(walletService?: WalletService) {
    this.walletService = walletService || new WalletService();
  }

  fund = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;
      const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
      const result = await this.walletService.fund(userId, amount, idempotencyKey);
      res.status(200).json(successResponse(result, "Account funded successfully"));
    } catch (error) {
      next(error);
    }
  };

  transfer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { recipient_email, amount } = req.body;
      const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
      const result = await this.walletService.transfer(
        userId,
        recipient_email,
        amount,
        idempotencyKey
      );
      res.status(200).json(successResponse(result, "Transfer successful"));
    } catch (error) {
      next(error);
    }
  };

  withdraw = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;
      const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
      const result = await this.walletService.withdraw(userId, amount, idempotencyKey);
      res.status(200).json(successResponse(result, "Withdrawal successful"));
    } catch (error) {
      next(error);
    }
  };

  getBalance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.walletService.getBalance(userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
