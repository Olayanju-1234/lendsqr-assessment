import { v4 as uuidv4 } from "uuid";
import db from "../../database/db";
import { UserModel } from "../../models/user.model";
import { WalletModel } from "../../models/wallet.model";
import { TransactionModel } from "../../models/transaction.model";
import { TransactionType } from "../../types";
import { HttpError } from "../../utils/http-error";

export class WalletService {
  async fund(
    userId: number,
    amount: number
  ): Promise<{ balance: number; reference: string }> {
    const reference = uuidv4();

    const newBalance = await db.transaction(async (trx) => {
      const wallet = await WalletModel.findByUserIdForUpdate(userId, trx);
      if (!wallet) {
        throw new HttpError(404, "Wallet not found");
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      await WalletModel.updateBalance(userId, balanceAfter, trx);

      await TransactionModel.create(
        {
          user_id: userId,
          type: TransactionType.FUND,
          amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference,
          description: "Account funding",
        },
        trx
      );

      return balanceAfter;
    });

    return { balance: newBalance, reference };
  }

  async transfer(
    senderId: number,
    recipientEmail: string,
    amount: number
  ): Promise<{ balance: number; reference: string }> {
    const recipient = await UserModel.findByEmail(recipientEmail);
    if (!recipient) {
      throw new HttpError(404, "Recipient not found");
    }

    if (senderId === recipient.id) {
      throw new HttpError(400, "Cannot transfer to yourself");
    }

    const reference = uuidv4();

    const senderNewBalance = await db.transaction(async (trx) => {
      // Lock wallets in ascending user_id order to prevent deadlocks
      const [firstId, secondId] =
        senderId < recipient.id
          ? [senderId, recipient.id]
          : [recipient.id, senderId];

      const wallets = await trx("wallets")
        .whereIn("user_id", [firstId, secondId])
        .orderBy("user_id", "asc")
        .forUpdate();

      const senderWallet = wallets.find(
        (w: { user_id: number }) => w.user_id === senderId
      );
      const recipientWallet = wallets.find(
        (w: { user_id: number }) => w.user_id === recipient.id
      );

      if (!senderWallet || !recipientWallet) {
        throw new HttpError(404, "Wallet not found");
      }

      const senderBalanceBefore = Number(senderWallet.balance);
      if (senderBalanceBefore < amount) {
        throw new HttpError(400, "Insufficient funds");
      }

      const recipientBalanceBefore = Number(recipientWallet.balance);
      const senderBalanceAfter = senderBalanceBefore - amount;
      const recipientBalanceAfter = recipientBalanceBefore + amount;

      // Update both wallet balances
      await WalletModel.updateBalance(senderId, senderBalanceAfter, trx);
      await WalletModel.updateBalance(
        recipient.id,
        recipientBalanceAfter,
        trx
      );

      // Dual-entry bookkeeping: two transaction records
      await TransactionModel.createMany(
        [
          {
            user_id: senderId,
            type: TransactionType.TRANSFER,
            amount: -amount,
            balance_before: senderBalanceBefore,
            balance_after: senderBalanceAfter,
            reference,
            counterparty_id: recipient.id,
            description: `Transfer to ${recipientEmail}`,
          },
          {
            user_id: recipient.id,
            type: TransactionType.TRANSFER,
            amount,
            balance_before: recipientBalanceBefore,
            balance_after: recipientBalanceAfter,
            reference,
            counterparty_id: senderId,
            description: `Transfer from user #${senderId}`,
          },
        ],
        trx
      );

      return senderBalanceAfter;
    });

    return { balance: senderNewBalance, reference };
  }

  async withdraw(
    userId: number,
    amount: number
  ): Promise<{ balance: number; reference: string }> {
    const reference = uuidv4();

    const newBalance = await db.transaction(async (trx) => {
      const wallet = await WalletModel.findByUserIdForUpdate(userId, trx);
      if (!wallet) {
        throw new HttpError(404, "Wallet not found");
      }

      const balanceBefore = Number(wallet.balance);
      if (balanceBefore < amount) {
        throw new HttpError(400, "Insufficient funds");
      }

      const balanceAfter = balanceBefore - amount;

      await WalletModel.updateBalance(userId, balanceAfter, trx);

      await TransactionModel.create(
        {
          user_id: userId,
          type: TransactionType.WITHDRAW,
          amount: -amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference,
          description: "Withdrawal",
        },
        trx
      );

      return balanceAfter;
    });

    return { balance: newBalance, reference };
  }

  async getBalance(userId: number): Promise<{ balance: number }> {
    const wallet = await WalletModel.findByUserId(userId);
    if (!wallet) {
      throw new HttpError(404, "Wallet not found");
    }

    return { balance: Number(wallet.balance) };
  }
}
