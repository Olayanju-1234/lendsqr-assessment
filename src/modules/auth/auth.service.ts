import bcrypt from "bcryptjs";
import db from "../../database/db";
import { UserModel } from "../../models/user.model";
import { WalletModel } from "../../models/wallet.model";
import { AdjutorService } from "../../services/adjutor.service";
import { HttpError } from "../../utils/http-error";
import { generateToken } from "../../utils/token";

interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export class AuthService {
  private adjutorService: AdjutorService;

  constructor(adjutorService?: AdjutorService) {
    this.adjutorService = adjutorService || new AdjutorService();
  }

  async register(
    data: RegisterData
  ): Promise<{ id: number; email: string; token: string }> {
    // Check if user is on the Karma blacklist
    const isBlacklisted = await this.adjutorService.isBlacklisted(data.email);
    if (isBlacklisted) {
      throw new HttpError(
        403,
        "User is blacklisted and cannot be onboarded"
      );
    }

    // Check for duplicate email
    const existingUser = await UserModel.findByEmail(data.email);
    if (existingUser) {
      throw new HttpError(409, "A user with this email already exists");
    }

    // Hash password and create user + wallet atomically
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userId = await db.transaction(async (trx) => {
      const id = await UserModel.create(
        {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          password: hashedPassword,
        },
        trx
      );

      await WalletModel.create(id, trx);
      return id;
    });

    const token = generateToken({ userId, email: data.email });

    return { id: userId, email: data.email, token };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ id: number; email: string; token: string }> {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = generateToken({ userId: user.id, email: user.email });

    return { id: user.id, email: user.email, token };
  }
}
