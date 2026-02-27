export interface NsDomain {
  domain: string;
  description?: string;
  timezone?: string;
  status: "active" | "suspended";
}

export interface NsUser {
  user: string;
  domain: string;
  firstName?: string;
  lastName?: string;
  extension?: string;
  email?: string;
}

export interface NsActiveCall {
  callId: string;
  from: string;
  to: string;
  startTime: string;
  duration: number;
  status: "active" | "on-hold" | "ringing" | "voicemail";
  direction: "inbound" | "outbound" | "internal";
}

export interface NsCallQueue {
  queue: string;
  domain: string;
  name?: string;
  waiting: number;
  agents: number;
  maxWaitTime: number;
}

export interface NsQueueStats {
  queue: string;
  answered: number;
  abandoned: number;
  avgWaitTime: number;
  avgTalkTime: number;
}

export interface NsAgent {
  user: string;
  queue: string;
  status: "available" | "busy" | "paused";
  callsToday: number;
  avgTime: number;
  loginTime: string;
}

export interface NsAbandonedCall {
  callId: string;
  queue: string;
  from: string;
  timestamp: string;
  waitTime: number;
}

export interface NsCdr {
  callId: string;
  startTime: string;
  endTime: string;
  from: string;
  to: string;
  duration: number;
  direction: "inbound" | "outbound" | "internal";
  disposition: "answered" | "busy" | "no-answer" | "failed";
}

export interface CdrCountParams {
  start?: string;
  end?: string;
}

export interface CdrParams extends CdrCountParams {
  user?: string;
  direction?: "inbound" | "outbound" | "internal";
  limit?: number;
  offset?: number;
}
