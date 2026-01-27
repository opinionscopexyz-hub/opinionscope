/**
 * Email templates for subscription lifecycle events
 */

type SubscriptionTier = "pro" | "pro_plus";
type EmailType = "welcome" | "canceled" | "expired";

export function buildSubscriptionEmailContent(
  tier: SubscriptionTier,
  type: EmailType
): { subject: string; html: string } {
  const tierName = tier === "pro_plus" ? "Pro+" : "Pro";

  if (type === "welcome") {
    return buildWelcomeEmail(tierName, tier);
  }

  if (type === "canceled") {
    return buildCanceledEmail(tierName);
  }

  return buildExpiredEmail(tierName);
}

function buildWelcomeEmail(
  tierName: string,
  tier: SubscriptionTier
): { subject: string; html: string } {
  const features =
    tier === "pro_plus"
      ? `
        <li>Real-time whale alerts with 30-second early access</li>
        <li>Unlimited alerts and follows</li>
        <li>Performance charts</li>
        <li>Priority support</li>
      `
      : `
        <li>Real-time whale activity feed</li>
        <li>50 alerts across all channels</li>
        <li>Custom filter expressions</li>
        <li>Follow up to 20 whales</li>
      `;

  return {
    subject: `Welcome to OpinionScope ${tierName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="margin: 0 0 16px; color: #333;">Welcome to OpinionScope ${tierName}!</h2>
            <p style="margin: 0 0 16px; color: #666; font-size: 16px; line-height: 1.5;">Your subscription is now active. Here's what you can do:</p>
            <ul style="margin: 0 0 24px; padding-left: 20px; color: #666;">
              ${features}
            </ul>
            <a href="https://opinionscope.xyz/screener" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Start Exploring</a>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #999; font-size: 12px;">Questions? Reply to this email.</p>
          </div>
        </body>
      </html>
    `,
  };
}

function buildCanceledEmail(tierName: string): { subject: string; html: string } {
  return {
    subject: "Your OpinionScope subscription has been canceled",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="margin: 0 0 16px; color: #333;">We're sorry to see you go</h2>
            <p style="margin: 0 0 16px; color: #666; font-size: 16px; line-height: 1.5;">Your subscription has been canceled, but you'll retain access to your ${tierName} features until your current billing period ends.</p>
            <p style="margin: 0 0 24px; color: #666; font-size: 16px; line-height: 1.5;">After that, your account will revert to the free tier.</p>
            <a href="https://opinionscope.xyz/pricing" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Resubscribe</a>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #999; font-size: 12px;">Feedback? We'd love to hear what we could improve - reply to this email.</p>
          </div>
        </body>
      </html>
    `,
  };
}

function buildExpiredEmail(tierName: string): { subject: string; html: string } {
  return {
    subject: "Your OpinionScope subscription has expired",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="margin: 0 0 16px; color: #333;">Your subscription has ended</h2>
            <p style="margin: 0 0 16px; color: #666; font-size: 16px; line-height: 1.5;">Your ${tierName} subscription has expired. Your account has been reverted to the free tier.</p>
            <p style="margin: 0 0 24px; color: #666; font-size: 16px; line-height: 1.5;">Resubscribe anytime to regain access to all your premium features.</p>
            <a href="https://opinionscope.xyz/pricing" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Plans</a>
          </div>
        </body>
      </html>
    `,
  };
}
