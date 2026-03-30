import axios from "axios";
import config from "../config";

export class AdjutorService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || config.ADJUTOR_BASE_URL;
    this.apiKey = apiKey || config.ADJUTOR_API_KEY;
  }

  async isBlacklisted(identity: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/verification/karma/${encodeURIComponent(identity)}`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: 5000,
        }
      );

      return (
        response.data?.status === "success" && response.data?.data != null
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }

      // Fail open: if the API is unavailable, allow registration
      console.error(
        "Adjutor API error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }
}
