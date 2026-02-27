import { prisma } from "@/prisma/prisma.config";

const NS_API_BASE_URL = process.env.NS_API_BASE_URL || "https://ns-api.netsapiens.com";
const NS_API_CLIENT_ID = process.env.NS_API_CLIENT_ID!;
const NS_API_CLIENT_SECRET = process.env.NS_API_CLIENT_SECRET!;
const NS_API_SCOPE = process.env.NS_API_SCOPE || "api:read api:write";

/**
 * NetSapiens API Client
 * Handles OAuth token management and API requests
 */
class NsApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = NS_API_BASE_URL;
  }

  /**
   * Get valid OAuth access token (cached or refreshed)
   */
  private async getAccessToken(): Promise<string> {
    // Check for valid cached token
    const cachedToken = await prisma.nsToken.findFirst({
      where: {
        expiresAt: {
          gt: new Date(Date.now() + 60000), // Valid for at least 1 more minute
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (cachedToken) {
      return cachedToken.accessToken;
    }

    // Request new token
    const tokenUrl = `${this.baseUrl}/oauth/token`;
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: NS_API_CLIENT_ID,
        client_secret: NS_API_CLIENT_SECRET,
        scope: NS_API_SCOPE,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NS-API OAuth failed: ${response.status} ${error}`);
    }

    const data = await response.json();

    // Cache token in database
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    await prisma.nsToken.create({
      data: {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresAt,
        scope: data.scope,
      },
    });

    return data.access_token;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `NS-API request failed: ${response.status} ${error}`
      );
    }

    return response.json();
  }

  /**
   * Get active calls
   */
  async getActiveCalls(): Promise<any[]> {
    return this.request("/v2/calls");
  }

  /**
   * Get queue statistics
   */
  async getQueues(): Promise<any[]> {
    return this.request("/v2/queues");
  }

  /**
   * Get agent presence status
   */
  async getPresence(): Promise<any[]> {
    return this.request("/v2/presence");
  }

  /**
   * Get call detail records
   */
  async getCDR(params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.startDate) query.set("start_date", params.startDate);
    if (params.endDate) query.set("end_date", params.endDate);
    if (params.limit) query.set("limit", params.limit.toString());

    return this.request(`/v2/cdr?${query.toString()}`);
  }

  /**
   * Get voicemails
   */
  async getVoicemails(): Promise<any[]> {
    return this.request("/v2/voicemails");
  }

  /**
   * Get DID inventory
   */
  async getDIDs(): Promise<any[]> {
    return this.request("/v2/dids");
  }

  /**
   * Get audit logs from NS-API
   */
  async getAuditLogs(params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.startDate) query.set("start_date", params.startDate);
    if (params.endDate) query.set("end_date", params.endDate);
    if (params.limit) query.set("limit", params.limit.toString());

    return this.request(`/v2/audit?${query.toString()}`);
  }

  /**
   * Disconnect a call
   */
  async disconnectCall(callId: string): Promise<void> {
    await this.request(`/v2/calls/${callId}`, {
      method: "DELETE",
    });
  }

  /**
   * Hold a call
   */
  async holdCall(callId: string): Promise<void> {
    await this.request(`/v2/calls/${callId}/hold`, {
      method: "POST",
    });
  }

  /**
   * Transfer a call
   */
  async transferCall(callId: string, destination: string): Promise<void> {
    await this.request(`/v2/calls/${callId}/transfer`, {
      method: "POST",
      body: JSON.stringify({ destination }),
    });
  }
}

// Export singleton instance
export const nsApi = new NsApiClient();
