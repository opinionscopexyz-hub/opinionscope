/**
 * Polar client utilities for client-side operations
 * Note: Product IDs are stored server-side only for security
 */

/**
 * Get Polar customer portal URL for subscription management
 */
export function getCustomerPortalUrl(customerId: string): string {
  return `https://polar.sh/dashboard/${customerId}`;
}
