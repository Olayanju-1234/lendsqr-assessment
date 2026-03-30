import { Request, Response, NextFunction } from "express";
import { TransactionService } from "./transaction.service";
import { successResponse } from "../../utils/response";

export class TransactionController {
  private transactionService: TransactionService;

  constructor(transactionService?: TransactionService) {
    this.transactionService =
      transactionService || new TransactionService();
  }

  getTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 20)
      );

      const result = await this.transactionService.getTransactionHistory(
        userId,
        page,
        limit
      );

      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
