import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

const http = httpRouter();

// ============ TYPES ============

interface WebhookData {
  id: string;
  product_id?: string;
  customer_email?: string;
  customer_id?: string;
  status?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

interface PolarWebhookEvent {
  type: string;
  data: WebhookData;
}

type WebhookCtx = Pick<ActionCtx, "runMutation" | "runAction">;

// ============ CLERK WEBHOOK TYPES ============

interface ClerkUserData {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  web3_wallets?: Array<{ web3_wallet: string }>;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
}

// ============ WEBHOOK SIGNATURE VERIFICATION ============

async function verifySvixSignature(
  body: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
  secret: string
): Promise<boolean> {
  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Svix signature format: v1,<base64_signature>
  // Multiple signatures may be present, separated by spaces
  const signatures = svixSignature.split(" ");
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;

  // Decode the secret (base64 with whsec_ prefix)
  const secretBytes = base64ToBytes(secret.replace("whsec_", ""));

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedContent)
  );

  const expectedSignature =
    "v1," + bytesToBase64(new Uint8Array(signatureBuffer));

  // Check if any of the provided signatures match
  for (const sig of signatures) {
    const trimmedSig = sig.trim();
    if (trimmedSig === expectedSignature) {
      return true;
    }
  }

  return false;
}

function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte)
  ).join("");
  return btoa(binString);
}

async function verifyPolarSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  // Polar uses HMAC-SHA256 for webhook signatures
  // Format: "sha256=<hex_digest>"
  const parts = signature.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    console.error("Invalid signature format");
    return false;
  }

  const providedDigest = parts[1];

  // Use Web Crypto API for HMAC
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );

  const computedDigest = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  if (providedDigest.length !== computedDigest.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < providedDigest.length; i++) {
    result |= providedDigest.charCodeAt(i) ^ computedDigest.charCodeAt(i);
  }

  return result === 0;
}

// ============ INPUT VALIDATION ============

function validateWebhookData(data: unknown): WebhookData | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const d = data as Record<string, unknown>;

  // Required field
  if (typeof d.id !== "string" || !d.id) {
    return null;
  }

  // Validate optional fields have correct types
  if (d.product_id !== undefined && typeof d.product_id !== "string") {
    return null;
  }
  if (d.customer_email !== undefined && typeof d.customer_email !== "string") {
    return null;
  }
  if (d.customer_id !== undefined && typeof d.customer_id !== "string") {
    return null;
  }
  if (d.status !== undefined && typeof d.status !== "string") {
    return null;
  }
  if (d.current_period_end !== undefined && typeof d.current_period_end !== "string") {
    return null;
  }
  if (d.cancel_at_period_end !== undefined && typeof d.cancel_at_period_end !== "boolean") {
    return null;
  }

  // Email format validation
  if (d.customer_email && !isValidEmail(d.customer_email as string)) {
    return null;
  }

  return {
    id: d.id as string,
    product_id: d.product_id as string | undefined,
    customer_email: d.customer_email as string | undefined,
    customer_id: d.customer_id as string | undefined,
    status: d.status as string | undefined,
    current_period_end: d.current_period_end as string | undefined,
    cancel_at_period_end: d.cancel_at_period_end as boolean | undefined,
  };
}

function isValidEmail(email: string): boolean {
  // Basic email validation - allows most valid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// ============ CLERK WEBHOOK HANDLER ============

http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();

    // Get webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get svix headers
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    // Verify webhook signature
    const isValid = await verifySvixSignature(
      body,
      svixId,
      svixTimestamp,
      svixSignature,
      webhookSecret
    );

    if (!isValid) {
      console.error("Invalid Clerk webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse webhook event
    let event: ClerkWebhookEvent;
    try {
      event = JSON.parse(body);
      if (!event.type || !event.data?.id) {
        throw new Error("Invalid event structure");
      }
    } catch (err) {
      console.error("Failed to parse Clerk webhook body:", err);
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { type, data } = event;

    try {
      if (type === "user.created" || type === "user.updated") {
        const email = data.email_addresses?.[0]?.email_address;
        const walletAddress = data.web3_wallets?.[0]?.web3_wallet?.toLowerCase();

        // Require at least one identifier (email or wallet)
        if (!email && !walletAddress) {
          console.error("No email or wallet found in Clerk webhook");
          return new Response(
            JSON.stringify({ error: "No email or wallet found" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const name =
          [data.first_name, data.last_name].filter(Boolean).join(" ") ||
          undefined;

        await ctx.runMutation(internal.users.syncFromClerkInternal, {
          clerkId: data.id,
          email,
          walletAddress,
          name,
          avatarUrl: data.image_url ?? undefined,
        });
      }

      if (type === "user.deleted") {
        await ctx.runMutation(internal.users.syncFromClerkInternal, {
          clerkId: data.id,
          deleted: true,
        });
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`Error processing Clerk webhook ${type}:`, error);
      return new Response(
        JSON.stringify({ error: "Webhook processing failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// ============ POLAR WEBHOOK HANDLER ============

http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();

    // Get webhook secret from environment
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing POLAR_WEBHOOK_SECRET");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature
    const signature = request.headers.get("polar-signature");
    const isValid = await verifyPolarSignature(body, signature, webhookSecret);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate JSON
    let event: PolarWebhookEvent;
    try {
      const parsed = JSON.parse(body);
      if (!parsed.type || typeof parsed.type !== "string") {
        throw new Error("Missing event type");
      }
      const validatedData = validateWebhookData(parsed.data);
      if (!validatedData) {
        throw new Error("Invalid event data");
      }
      event = { type: parsed.type, data: validatedData };
    } catch (err) {
      console.error("Failed to parse/validate webhook body:", err);
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { type, data } = event;

    try {
      switch (type) {
        case "subscription.created":
        case "subscription.updated":
          await handleSubscriptionActive(ctx, data);
          break;

        case "subscription.canceled":
          await handleSubscriptionCanceled(ctx, data);
          break;

        case "subscription.revoked":
          await handleSubscriptionRevoked(ctx, data);
          break;

        default:
          console.log(`Unhandled webhook event type: ${type}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`Error processing webhook ${type}:`, error);
      return new Response(
        JSON.stringify({ error: "Webhook processing failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// ============ HELPER FUNCTIONS ============

function getSubscriptionTier(productId: string): "pro" | "pro_plus" | null {
  const proMonthly = process.env.POLAR_PRO_MONTHLY_ID;
  const proAnnual = process.env.POLAR_PRO_ANNUAL_ID;
  const proPlusMonthly = process.env.POLAR_PRO_PLUS_MONTHLY_ID;
  const proPlusAnnual = process.env.POLAR_PRO_PLUS_ANNUAL_ID;

  if (productId === proMonthly || productId === proAnnual) {
    return "pro";
  }
  if (productId === proPlusMonthly || productId === proPlusAnnual) {
    return "pro_plus";
  }
  return null;
}

// ============ SUBSCRIPTION HANDLERS ============

async function handleSubscriptionActive(
  ctx: WebhookCtx,
  data: WebhookData
): Promise<void> {
  const { customer_email, product_id, id: subscriptionId, customer_id } = data;

  if (!customer_email || !product_id) {
    console.error("Missing customer_email or product_id in subscription event");
    return;
  }

  const tier = getSubscriptionTier(product_id);
  if (!tier) {
    console.warn(`Unknown product_id: ${product_id}`);
    return;
  }

  // Update user tier in Convex
  const result = await ctx.runMutation(
    internal.subscriptions.updateUserSubscription,
    {
      email: customer_email,
      tier,
      polarCustomerId: customer_id,
      polarSubscriptionId: subscriptionId,
    }
  );

  if (result.success) {
    // Send welcome email
    await ctx.runAction(internal.subscriptions.sendSubscriptionEmail, {
      to: customer_email,
      tier,
      type: "welcome",
    });
  }
}

async function handleSubscriptionCanceled(
  ctx: WebhookCtx,
  data: WebhookData
): Promise<void> {
  const { customer_email, current_period_end } = data;

  if (!customer_email) {
    console.error("Missing customer_email in subscription.canceled event");
    return;
  }

  // Set tier expiration (keep features until period ends)
  const tierExpiresAt = current_period_end
    ? new Date(current_period_end).getTime()
    : Date.now() + 24 * 60 * 60 * 1000; // Default to 24h if no period end

  // Mark subscription as canceled - tier will be handled by scheduled job
  // This avoids the race condition by only setting expiration, not guessing tier
  const result = await ctx.runMutation(
    internal.subscriptions.markSubscriptionCanceled,
    {
      email: customer_email,
      tierExpiresAt,
    }
  );

  // Send cancellation email if user found and has a paid tier
  if (result.success && result.tier && result.tier !== "free") {
    await ctx.runAction(internal.subscriptions.sendSubscriptionEmail, {
      to: customer_email,
      tier: result.tier,
      type: "canceled",
    });
  }
}

async function handleSubscriptionRevoked(
  ctx: WebhookCtx,
  data: WebhookData
): Promise<void> {
  const { customer_email } = data;

  if (!customer_email) {
    console.error("Missing customer_email in subscription.revoked event");
    return;
  }

  // Get user's current tier before downgrading
  const result = await ctx.runMutation(internal.subscriptions.downgradeToFree, {
    email: customer_email,
  });

  // Send expiration email if user was on a paid tier
  if (result.success && result.previousTier && result.previousTier !== "free") {
    await ctx.runAction(internal.subscriptions.sendSubscriptionEmail, {
      to: customer_email,
      tier: result.previousTier,
      type: "expired",
    });
  }
}

export default http;
