import bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";
import { UserModel } from "../../models/user.model";
import { WalletModel } from "../../models/wallet.model";
import { AdjutorService } from "../../services/adjutor.service";
import db from "../../database/db";
import { HttpError } from "../../utils/http-error";

// Mock dependencies
jest.mock("../../database/db", () => {
  const mockTrx = jest.fn();
  const mockDb = jest.fn();
  (mockDb as any).transaction = jest.fn((callback: Function) =>
    callback(mockTrx)
  );
  return { __esModule: true, default: mockDb };
});

jest.mock("../../models/user.model");
jest.mock("../../models/wallet.model");
jest.mock("../../utils/token", () => ({
  generateToken: jest.fn(() => "mock-jwt-token"),
}));

describe("AuthService", () => {
  let authService: AuthService;
  let mockAdjutorService: jest.Mocked<AdjutorService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdjutorService = {
      isBlacklisted: jest.fn(),
    } as unknown as jest.Mocked<AdjutorService>;
    authService = new AuthService(mockAdjutorService);
  });

  describe("register", () => {
    const validData = {
      email: "john@example.com",
      first_name: "John",
      last_name: "Doe",
      password: "password123",
    };

    it("should register a new user and return a token", async () => {
      mockAdjutorService.isBlacklisted.mockResolvedValue(false);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);
      (UserModel.create as jest.Mock).mockResolvedValue(1);
      (WalletModel.create as jest.Mock).mockResolvedValue(1);

      const result = await authService.register(validData);

      expect(result).toEqual({
        id: 1,
        email: "john@example.com",
        token: "mock-jwt-token",
      });
      expect(mockAdjutorService.isBlacklisted).toHaveBeenCalledWith(
        "john@example.com"
      );
      expect(UserModel.create).toHaveBeenCalled();
      expect(WalletModel.create).toHaveBeenCalled();
    });

    it("should throw 403 when user is blacklisted", async () => {
      mockAdjutorService.isBlacklisted.mockResolvedValue(true);

      await expect(authService.register(validData)).rejects.toThrow(HttpError);
      await expect(authService.register(validData)).rejects.toMatchObject({
        statusCode: 403,
        message: "User is blacklisted and cannot be onboarded",
      });

      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it("should throw 409 when email already exists", async () => {
      mockAdjutorService.isBlacklisted.mockResolvedValue(false);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: "john@example.com",
      });

      await expect(authService.register(validData)).rejects.toThrow(HttpError);
      await expect(authService.register(validData)).rejects.toMatchObject({
        statusCode: 409,
        message: "A user with this email already exists",
      });

      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it("should allow registration when Adjutor API is unavailable (fail-open)", async () => {
      mockAdjutorService.isBlacklisted.mockResolvedValue(false);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);
      (UserModel.create as jest.Mock).mockResolvedValue(1);
      (WalletModel.create as jest.Mock).mockResolvedValue(1);

      const result = await authService.register(validData);

      expect(result.id).toBe(1);
      expect(result.token).toBe("mock-jwt-token");
    });
  });

  describe("login", () => {
    it("should return a token for valid credentials", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: "john@example.com",
        password: hashedPassword,
      });

      const result = await authService.login("john@example.com", "password123");

      expect(result).toEqual({
        id: 1,
        email: "john@example.com",
        token: "mock-jwt-token",
      });
    });

    it("should throw 401 for non-existent email", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);

      await expect(
        authService.login("nonexistent@example.com", "password123")
      ).rejects.toThrow(HttpError);
      await expect(
        authService.login("nonexistent@example.com", "password123")
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid email or password",
      });
    });

    it("should throw 401 for incorrect password", async () => {
      const hashedPassword = await bcrypt.hash("correctpassword", 10);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: "john@example.com",
        password: hashedPassword,
      });

      await expect(
        authService.login("john@example.com", "wrongpassword")
      ).rejects.toThrow(HttpError);
      await expect(
        authService.login("john@example.com", "wrongpassword")
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid email or password",
      });
    });
  });
});
