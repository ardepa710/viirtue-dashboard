import { prisma } from "@/prisma/prisma.config";
import type {
  NsActiveCall,
  NsCdr,
  CdrParams,
} from "@/types/ns-api";

const NS_API_BASE_URL = process.env.NS_API_BASE_URL || "https://portal.viirtue.com/ns-api";
const NS_API_CLIENT_ID = process.env.NS_API_CLIENT_ID!;
const NS_API_CLIENT_SECRET = process.env.NS_API_CLIENT_SECRET!;
const NS_API_USERNAME = process.env.NS_API_USERNAME!;
const NS_API_PASSWORD = process.env.NS_API_PASSWORD!;
const NS_API_SCOPE = process.env.NS_API_SCOPE || "api:read api:write";

/**
 * Custom error class for NS-API errors
 */
export class NSApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public endpoint?: string
  ) {
    super(message);
    this.name = "NSApiError";
  }
}

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
    const tokenUrl = `${this.baseUrl}/oauth2/token/`;
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: NS_API_CLIENT_ID,
        client_secret: NS_API_CLIENT_SECRET,
        username: NS_API_USERNAME,
        password: NS_API_PASSWORD,
        scope: NS_API_SCOPE,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new NSApiError(response.status, `OAuth failed: ${error}`, "/oauth/token");
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

    // Cleanup old tokens
    await prisma.nsToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    return data.access_token;
  }

  /**
   * Make authenticated legacy API request (NS v44 query-parameter style)
   * Base URL: /ns-api/?object=X&action=read&format=json
   */
  private async request<T>(
    params: Record<string, string>,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();

    const query = new URLSearchParams({ format: "json", ...params });
    const url = `${this.baseUrl}/?${query.toString()}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new NSApiError(
        response.status,
        `Request failed: ${error}`,
        params.object
      );
    }

    return response.json();
  }

  /**
   * Get active calls — transforms NS `call` object to NsActiveCall[]
   */
  async getActiveCalls(): Promise<NsActiveCall[]> {
    const raw = await this.request<any[]>({ object: "call", action: "read" });
    if (!Array.isArray(raw)) return [];

    return raw.map((c) => {
      const ani = c.ani || c.orig_user || "";
      const dnis = c.dnis || c.term_user || "";
      const isExternal = (num: string) => num.replace(/\D/g, "").length >= 10;
      const direction: NsActiveCall["direction"] =
        isExternal(ani) ? "inbound"
        : isExternal(dnis) ? "outbound"
        : "internal";

      const startMs = c.time_begin
        ? new Date(c.time_begin.replace(" ", "T") + "Z").getTime()
        : Date.now();
      const duration = Math.floor((Date.now() - startMs) / 1000);

      const statusMap: Record<string, NsActiveCall["status"]> = {
        active: "active",
        hold: "on-hold",
        ringing: "ringing",
      };

      return {
        callId: c.session_id || c.by_callid || "",
        from: c.orig_name ? `${c.orig_name} (${ani})` : ani,
        to: dnis,
        startTime: c.time_begin || "",
        duration: Math.max(0, duration),
        status: statusMap[c.orig_call_info] ?? "active",
        direction,
      };
    });
  }

  /**
   * Get queue statistics — transforms NS `callqueue` to NsCallQueue[]
   */
  async getQueues(): Promise<any[]> {
    const raw = await this.request<any[]>({ object: "callqueue", action: "read", domain: "solytics" });
    if (!Array.isArray(raw)) return [];

    return raw.map((q) => ({
      queue: q.queue_name,
      domain: q.domain,
      name: q.description || q.queue_name,
      waiting: Number(q.queuedcall_count) || 0,
      agents: Number(q.agent_loggedin_count) || 0,
      maxWaitTime: Number(q.wait_limit) || 0,
    }));
  }

  /**
   * Get agent presence status (subscribers with call_limit info)
   */
  async getPresence(): Promise<any[]> {
    return this.request({ object: "subscriber", action: "read" });
  }

  /**
   * Get call detail records — uses NS `cdr2` object, transforms to NsCdr[]
   */
  async getCDR(params: CdrParams = {}): Promise<NsCdr[]> {
    const nsParams: Record<string, string> = { object: "cdr2", action: "read" };
    if (params.start) nsParams.time_start = params.start;
    if (params.end) nsParams.time_end = params.end;
    if (params.limit) nsParams.limit = params.limit.toString();
    if (params.offset) nsParams.offset = params.offset.toString();

    const raw = await this.request<any[]>(nsParams);
    if (!Array.isArray(raw)) return [];

    return raw.map((r) => {
      const detail = r.CdrR || r;
      const tsToIso = (ts: string | number | null) =>
        ts ? new Date(Number(ts) * 1000).toISOString() : "";

      const origUser = detail.orig_from_user || detail.orig_sub || r.orig_from_uri?.split(":")[1]?.split("@")[0] || "";
      const termUser = detail.term_id || detail.term_sub || r.orig_req_user || "";
      const isExternal = (num: string) => num.replace(/\D/g, "").length >= 10;

      const direction: NsCdr["direction"] =
        isExternal(origUser) ? "inbound"
        : isExternal(termUser) ? "outbound"
        : "internal";

      const talking = Number(detail.time_talking ?? r.time_talking ?? 0);
      const reason = detail.reason || "";
      const disposition: NsCdr["disposition"] =
        talking > 0 ? "answered"
        : reason === "486" ? "busy"
        : reason === "487" || reason === "480" ? "no-answer"
        : "failed";

      return {
        callId: r.cdr_id || detail.orig_callid || "",
        startTime: tsToIso(r.time_start ?? detail.time_start),
        endTime: tsToIso(r.time_release ?? detail.time_release),
        from: origUser,
        to: termUser,
        duration: Number(r.duration ?? detail.duration ?? 0),
        direction,
        disposition,
      };
    });
  }

  /**
   * Get voicemails
   */
  async getVoicemails(): Promise<any[]> {
    return this.request({ object: "voicemail", action: "read" });
  }

  /**
   * Get DID inventory
   */
  async getDIDs(): Promise<any[]> {
    return this.request({ object: "did", action: "read" });
  }

  /**
   * Get all subscribers (VoIP Users) — transforms NS `subscriber` object
   */
  async getSubscribers(): Promise<any[]> {
    const raw = await this.request<any[]>({ object: "subscriber", action: "read" });
    if (!Array.isArray(raw)) return [];

    const domains = Array.from(new Set(raw.map((s) => s.domain as string))).sort();

    const users = raw.map((s) => ({
      title: `${s.user}@${s.domain}`,
      name: [s.first_name, s.last_name].filter(Boolean).join(" ") || s.subscriber_login || s.user,
      domain: s.domain || "",
      extension: s.user || "",
      callerId: s.callid_nmbr || s.subscriber_login || "",
      email: s.email || "",
      voicemail: s.vmail_enabled === "yes",
      scope: s.scope || "",
    }));

    return [users, domains];
  }

  /**
   * Get all phone numbers — transforms NS `phonenumber` object
   */
  async getPhoneNumbers(): Promise<any[]> {
    const raw = await this.request<any[]>({ object: "phonenumber", action: "read" });
    if (!Array.isArray(raw)) return [];

    const extractNumber = (matchrule: string) =>
      (matchrule.match(/sip:(\d+)@/) || [])[1] || matchrule;

    const getTreatment = (responder: string) => {
      if (!responder) return "Unknown";
      if (responder.includes("available")) return "Available";
      return "User";
    };

    const numbers = raw.map((n) => ({
      title: n.matchrule || "",
      phoneNumber: extractNumber(n.matchrule || ""),
      treatment: getTreatment(n.responder || ""),
      destination: n.to_user && n.to_host ? `${n.to_user}@${n.to_host}` : (n.plan_description || ""),
      status: n.enable === "yes",
      domain: n.dialrule_domain || n.domain_owner || n.domain || "",
    }));

    const domains = Array.from(new Set(numbers.map((n) => n.domain as string))).filter(Boolean).sort();

    return [numbers, domains];
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any[]> {
    const nsParams: Record<string, string> = { object: "audit", action: "read" };
    if (params.startDate) nsParams.start_date = params.startDate;
    if (params.endDate) nsParams.end_date = params.endDate;
    if (params.limit) nsParams.limit = params.limit.toString();

    return this.request(nsParams);
  }

  /**
   * Disconnect a call
   */
  async disconnectCall(callId: string): Promise<void> {
    await this.request({ object: "call", action: "delete", session_id: callId });
  }

  /**
   * Hold a call
   */
  async holdCall(callId: string): Promise<void> {
    await this.request({ object: "call", action: "update", session_id: callId, call_state: "hold" });
  }

  /**
   * Transfer a call
   */
  async transferCall(callId: string, destination: string): Promise<void> {
    await this.request({ object: "call", action: "update", session_id: callId, transfer_to: destination });
  }
}

// Export singleton instance
export const nsApi = new NsApiClient();
