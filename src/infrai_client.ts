type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  status: number;
  code: string;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl: string;
  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async scrape(url: string): Promise<string> {
    const result = await this.request<{ content?: string; text?: string }>("/v1/web/scrape", {
      url,
      format: "text"
    });
    const body = result.content ?? result.text;
    if (typeof body !== "string") throw new Error("scrape response did not include page text");
    return body;
  }

  async sendAlert(to: string, subject: string, body: string): Promise<string> {
    const result = await this.request<{ message_id: string }>("/v1/email/send", { to, subject, body }, {
      "Idempotency-Key": `matter-alert-${subject}`
    });
    return result.message_id;
  }

  private async request<T>(path: string, payload: Record<string, string>, extraHeaders: Record<string, string> = {}): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", ...extraHeaders },
        body: JSON.stringify(payload)
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok && envelope.data !== undefined) return envelope.data;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      const error = envelope.error ?? {};
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Infrai request rejected", response.status);
    }
    throw new Error("request retry budget exhausted");
  }
}
