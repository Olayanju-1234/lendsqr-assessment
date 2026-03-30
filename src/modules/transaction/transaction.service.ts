import { TransactionModel } from "../../models/transaction.model";
import { Transaction } from "../../types";

interface PaginatedTransactions {
  transactions: Transaction[];
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
}

export class TransactionService {
  async getTransactionHistory(
    userId: number,
    page: number,
    limit: number
  ): Promise<PaginatedTransactions> {
    const { transactions, total } = await TransactionModel.findByUserId(
      userId,
      page,
      limit
    );

    const totalPages = Math.ceil(total / limit);

    return {
      transactions,
      page,
      limit,
      totalPages,
      totalRecords: total,
    };
  }
}
