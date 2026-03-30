import { WalletService } from "./wallet.service";
import { UserModel } from "../../models/user.model";
import { WalletModel } from "../../models/wallet.model";
import { TransactionModel } from "../../models/transaction.model";
import { HttpError } from "../../utils/http-error";
import { TransactionType } from "../../types";

// Mock uuid to return predictable values
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-reference"),
}));

// Create a chainable mock transaction object
// When called as trx("wallets"), it returns itself for chaining
const mockQueryChain: any = {};
mockQueryChain.whereIn = jest.fn().mockReturnValue(mockQueryChain);
mockQueryChain.orderBy = jest.fn().mockReturnValue(mockQueryChain);
mockQueryChain.forUpdate = jest.fn().mockReturnValue(mockQueryChain);

const mockTrx = jest.fn().mockReturnValue(mockQueryChain) as any;
mockTrx.whereIn = mockQueryChain.whereIn;
mockTrx.orderBy = mockQueryChain.orderBy;
mockTrx.forUpdate = mockQueryChain.forUpdate;

jest.mock("../../database/db", () => {
  const mockDb = jest.fn();
  (mockDb as any).transaction = jest.fn();
  return { __esModule: true, default: mockDb };
});

jest.mock("../../models/user.model");
jest.mock("../../models/wallet.model");
jest.mock("../../models/transaction.model");

import db from "../../database/db";

describe("WalletService", () => {
  let walletService: WalletService;

  beforeEach(() => {
    jest.clearAllMocks();
    walletService = new WalletService();

    // Setup db.transaction to execute callback with mockTrx
    (db.transaction as jest.Mock).mockImplementation(
      async (callback: Function) => {
        return callback(mockTrx);
      }
    );

    // Reset mockTrx chain
    mockQueryChain.whereIn = jest.fn().mockReturnValue(mockQueryChain);
    mockQueryChain.orderBy = jest.fn().mockReturnValue(mockQueryChain);
    mockQueryChain.forUpdate = jest.fn().mockReturnValue(mockQueryChain);
    mockTrx.mockReturnValue(mockQueryChain);
  });

  describe("fund", () => {
    it("should fund account and return new balance", async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue({
        user_id: 1,
        balance: "500.00",
      });
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue(1);

      const result = await walletService.fund(1, 200);

      expect(result).toEqual({
        balance: 700,
        reference: "mock-uuid-reference",
      });
      expect(WalletModel.updateBalance).toHaveBeenCalledWith(1, 700, mockTrx);
      expect(TransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          type: TransactionType.FUND,
          amount: 200,
          balance_before: 500,
          balance_after: 700,
        }),
        mockTrx
      );
    });

    it("should throw 404 when wallet is not found", async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue(
        undefined
      );

      await expect(walletService.fund(999, 200)).rejects.toThrow(HttpError);
      await expect(walletService.fund(999, 200)).rejects.toMatchObject({
        statusCode: 404,
        message: "Wallet not found",
      });
    });
  });

  describe("transfer", () => {
    it("should debit sender and credit recipient with dual-entry records", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: 2,
        email: "recipient@example.com",
      });

      // Mock the wallet lock query chain to resolve with both wallets
      mockQueryChain.forUpdate.mockResolvedValue([
        { user_id: 1, balance: "1000.00" },
        { user_id: 2, balance: "300.00" },
      ]);

      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.createMany as jest.Mock).mockResolvedValue(undefined);

      const result = await walletService.transfer(
        1,
        "recipient@example.com",
        250
      );

      expect(result).toEqual({
        balance: 750,
        reference: "mock-uuid-reference",
      });

      // Verify both wallets were updated
      expect(WalletModel.updateBalance).toHaveBeenCalledWith(1, 750, mockTrx);
      expect(WalletModel.updateBalance).toHaveBeenCalledWith(2, 550, mockTrx);

      // Verify dual-entry transaction records
      expect(TransactionModel.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 1,
            type: TransactionType.TRANSFER,
            amount: -250,
            balance_before: 1000,
            balance_after: 750,
            counterparty_id: 2,
          }),
          expect.objectContaining({
            user_id: 2,
            type: TransactionType.TRANSFER,
            amount: 250,
            balance_before: 300,
            balance_after: 550,
            counterparty_id: 1,
          }),
        ]),
        mockTrx
      );
    });

    it("should throw 404 when recipient does not exist", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);

      await expect(
        walletService.transfer(1, "nonexistent@example.com", 100)
      ).rejects.toThrow(HttpError);
      await expect(
        walletService.transfer(1, "nonexistent@example.com", 100)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Recipient not found",
      });
    });

    it("should throw 400 when transferring to yourself", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: "self@example.com",
      });

      await expect(
        walletService.transfer(1, "self@example.com", 100)
      ).rejects.toThrow(HttpError);
      await expect(
        walletService.transfer(1, "self@example.com", 100)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Cannot transfer to yourself",
      });
    });

    it("should throw 400 when sender has insufficient funds", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: 2,
        email: "recipient@example.com",
      });

      mockQueryChain.forUpdate.mockResolvedValue([
        { user_id: 1, balance: "50.00" },
        { user_id: 2, balance: "300.00" },
      ]);

      await expect(
        walletService.transfer(1, "recipient@example.com", 100)
      ).rejects.toThrow(HttpError);
      await expect(
        walletService.transfer(1, "recipient@example.com", 100)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Insufficient funds",
      });

      expect(WalletModel.updateBalance).not.toHaveBeenCalled();
    });

    it("should lock wallets in ascending user_id order for deadlock prevention", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: 2,
        email: "recipient@example.com",
      });

      mockQueryChain.forUpdate.mockResolvedValue([
        { user_id: 1, balance: "1000.00" },
        { user_id: 2, balance: "300.00" },
      ]);
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.createMany as jest.Mock).mockResolvedValue(undefined);

      await walletService.transfer(1, "recipient@example.com", 100);

      // Verify lock order: user_id 1 before user_id 2
      expect(mockQueryChain.whereIn).toHaveBeenCalledWith("user_id", [1, 2]);
      expect(mockQueryChain.orderBy).toHaveBeenCalledWith("user_id", "asc");
      expect(mockQueryChain.forUpdate).toHaveBeenCalled();
    });
  });

  describe("withdraw", () => {
    it("should withdraw funds and return new balance", async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue({
        user_id: 1,
        balance: "800.00",
      });
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue(1);

      const result = await walletService.withdraw(1, 300);

      expect(result).toEqual({
        balance: 500,
        reference: "mock-uuid-reference",
      });
      expect(WalletModel.updateBalance).toHaveBeenCalledWith(1, 500, mockTrx);
      expect(TransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          type: TransactionType.WITHDRAW,
          amount: -300,
          balance_before: 800,
          balance_after: 500,
        }),
        mockTrx
      );
    });

    it("should throw 400 when balance is insufficient", async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue({
        user_id: 1,
        balance: "50.00",
      });

      await expect(walletService.withdraw(1, 200)).rejects.toThrow(HttpError);
      await expect(walletService.withdraw(1, 200)).rejects.toMatchObject({
        statusCode: 400,
        message: "Insufficient funds",
      });

      expect(WalletModel.updateBalance).not.toHaveBeenCalled();
    });

    it("should throw 404 when wallet is not found", async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue(
        undefined
      );

      await expect(walletService.withdraw(999, 100)).rejects.toThrow(
        HttpError
      );
      await expect(walletService.withdraw(999, 100)).rejects.toMatchObject({
        statusCode: 404,
        message: "Wallet not found",
      });
    });
  });

  describe("getBalance", () => {
    it("should return the current wallet balance", async () => {
      (WalletModel.findByUserId as jest.Mock).mockResolvedValue({
        user_id: 1,
        balance: "1250.50",
      });

      const result = await walletService.getBalance(1);

      expect(result).toEqual({ balance: 1250.5 });
    });

    it("should throw 404 when wallet is not found", async () => {
      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(undefined);

      await expect(walletService.getBalance(999)).rejects.toThrow(HttpError);
      await expect(walletService.getBalance(999)).rejects.toMatchObject({
        statusCode: 404,
        message: "Wallet not found",
      });
    });
  });
});
