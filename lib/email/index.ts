// ─────────────────────────────────────────────────────────────────────────────
// lib/email — transactional & nudge email, abstracted from the provider.
//
// v1 uses Resend; swap the provider in one place. NEVER put vault contents or
// secrets in an email body — emails notify that *something exists* and link the
// recipient to log in (see the recipient experience). The only exception is
// funeral-wishes delivery to an authorised director, which is an explicit,
// approved release decision.
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body. Keep it gentle; never include secrets. */
  text: string;
  /** Optional tag for delivery analytics (no PII). */
  tag?: string;
}

export interface EmailProvider {
  send(msg: EmailMessage): Promise<{ id: string }>;
}

class ResendProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(msg: EmailMessage): Promise<{ id: string }> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        tags: msg.tag ? [{ name: "kind", value: msg.tag }] : undefined,
      }),
    });
    if (!res.ok) throw new Error(`email send failed: ${res.status}`);
    const data = (await res.json()) as { id: string };
    return { id: data.id };
  }
}

/** Dev/test provider: records messages instead of sending. */
export class MemoryEmailProvider implements EmailProvider {
  public readonly sent: EmailMessage[] = [];
  async send(msg: EmailMessage): Promise<{ id: string }> {
    this.sent.push(msg);
    return { id: `mem_${this.sent.length}` };
  }
}

export function getEmailProvider(): EmailProvider {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Gaia Vault <care@vault.gaiaapp.net>";
  if (!key) {
    // No key configured (e.g. local dev) — fall back to in-memory so flows work.
    return new MemoryEmailProvider();
  }
  return new ResendProvider(key, from);
}
