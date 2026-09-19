type RpcClient = {
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => PromiseLike<{ error: { message?: string } | null }>;
};

export type AuroraNotifyEmail = {
  to: string;
  from: string;
  senderDomain?: string;
  subject: string;
  html: string;
  text?: string;
  purpose?: string;
  label?: string;
  messageId?: string;
};

export type AuroraNotification = {
  event: string;
  subscriberId: string;
  payload?: Record<string, unknown>;
  email?: AuroraNotifyEmail;
};

export type AuroraNotifyResult = {
  emailQueued: boolean;
  eventForwarded: boolean;
};

/**
 * Gemensamt notifieringslager för Hönsgården/Aurora-produkter.
 *
 * Standardläget använder Hönsgårdens befintliga transactional email queue.
 * Om AURORA_NOTIFY_WEBHOOK_URL sätts speglas samma domänhändelse dessutom
 * till ett externt workflow-/notification-lager (t.ex. Activepieces/Novu).
 *
 * Externa fel är avsiktligt "best effort": ett trasigt workflow får aldrig
 * stoppa den primära transaktionskommunikationen.
 */
export async function dispatchAuroraNotification(
  client: RpcClient,
  notification: AuroraNotification,
): Promise<AuroraNotifyResult> {
  let emailQueued = false;

  if (notification.email) {
    const email = notification.email;
    const { error } = await client.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: email.to,
        from: email.from,
        sender_domain: email.senderDomain,
        subject: email.subject,
        html: email.html,
        text: email.text ?? "",
        purpose: email.purpose ?? "transactional",
        label: email.label ?? notification.event,
        message_id:
          email.messageId ??
          `${notification.event}-${notification.subscriberId}-${crypto.randomUUID()}`,
        queued_at: new Date().toISOString(),
      },
    });

    if (error) {
      throw new Error(
        `Kunde inte köa notifieringsmejl: ${error.message ?? "okänt fel"}`,
      );
    }

    emailQueued = true;
  }

  const webhookUrl = Deno.env.get("AURORA_NOTIFY_WEBHOOK_URL")?.trim();
  let eventForwarded = false;

  if (webhookUrl) {
    try {
      const token = Deno.env.get("AURORA_NOTIFY_WEBHOOK_TOKEN")?.trim();
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          event: notification.event,
          subscriberId: notification.subscriberId,
          payload: notification.payload ?? {},
          occurredAt: new Date().toISOString(),
          source: Deno.env.get("AURORA_NOTIFY_SOURCE") ?? "honsgarden",
          channels: {
            email: notification.email
              ? {
                  to: notification.email.to,
                  subject: notification.email.subject,
                  queued: emailQueued,
                }
              : null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook svarade ${response.status}: ${(await response.text()).slice(0, 180)}`,
        );
      }

      eventForwarded = true;
    } catch (error) {
      console.error("Aurora Notify webhook misslyckades", error);
    }
  }

  if (!notification.email && !webhookUrl) {
    throw new Error(
      "Aurora Notify saknar både lokal kanal och AURORA_NOTIFY_WEBHOOK_URL",
    );
  }

  return { emailQueued, eventForwarded };
}
