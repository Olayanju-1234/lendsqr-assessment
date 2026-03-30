import { TransactionService } from "./transaction.service";
import { TransactionModel } from "../../models/transaction.model";
import { TransactionType } from "../../types";

jest.mock("../../models/transaction.model");

describe("TransactionService", () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionService = new TransactionService();
  });

  describe("getTransactionHistory", () => {
    it("should return paginated transaction history", async () => {
      const mockTransactions = [
        {
          id: 1,
          user_id: 1,
          type: TransactionType.FUND,
          amount: "500.00",
          balance_before: "0.00",
          balance_after: "500.00",
          reference: "uuid-1",
          counterparty_id: null,
          description: "Account funding",
          created_at: new Date("2026-03-30"),
        },
        {
          id: 2,
          user_id: 1,
          type: TransactionType.TRANSFER,
          amount: "-200.00",
          balance_before: "500.00",
          balance_after: "300.00",
          reference: "uuid-2",
          counterparty_id: 2,
          description: "Transfer to user@example.com",
          created_at: new Date("2026-03-30"),
        },
      ];

      (TransactionModel.findByUserId as jest.Mock).mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
      });

      const result = await transactionService.getTransactionHistory(1, 1, 20);

      expect(result).toEqual({
        transactions: mockTransactions,
        page: 1,
        limit: 20,
        totalPages: 1,
        totalRecords: 2,
      });
      expect(TransactionModel.findByUserId).toHaveBeenCalledWith(1, 1, 20);
    });

    it("should calculate correct total pages", async () => {
      (TransactionModel.findByUserId as jest.Mock).mockResolvedValue({
        transactions: [],
        total: 45,
      });

      const result = await transactionService.getTransactionHistory(1, 1, 20);

      expect(result.totalPages).toBe(3);
      expect(result.totalRecords).toBe(45);
    });

    it("should return empty results when user has no transactions", async () => {
      (TransactionModel.findByUserId as jest.Mock).mockResolvedValue({
        transactions: [],
        total: 0,
      });

      const result = await transactionService.getTransactionHistory(1, 1, 20);

      expect(result).toEqual({
        transactions: [],
        page: 1,
        limit: 20,
        totalPages: 0,
        totalRecords: 0,
      });
    });
  });
});
