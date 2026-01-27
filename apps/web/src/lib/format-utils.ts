/**
 * Utility functions for formatting market data.
 * Centralizes price/volume conversion logic for consistency.
 */

/**
 * Format volume to human-readable string ($1.2M, $500K, $100)
 */
export function formatVolume(vol: number): string {
  if (vol > 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

/**
 * Format price (0-1 decimal) to percentage string
 */
export function formatPrice(price: number): string {
  return `${(price * 100).toFixed(0)}%`;
}

/**
 * Format 24h change with sign indicator
 */
export function formatChange(change?: number): string {
  if (change === undefined || change === null) return "-";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${(change * 100).toFixed(1)}%`;
}

/**
 * Convert UI percentage (0-100) to DB decimal (0-1)
 */
export function percentToDecimal(percent: number): number {
  return percent / 100;
}

/**
 * Convert DB decimal (0-1) to UI percentage (0-100)
 */
export function decimalToPercent(decimal: number): number {
  return decimal * 100;
}

/**
 * Calculate days remaining until a timestamp
 */
export function getDaysRemaining(endDate: number): number {
  return Math.max(
    0,
    Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24))
  );
}

/**
 * Format P&L with sign indicator (e.g., +$1.2M, -$500K)
 */
export function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "-";
  const absPnl = Math.abs(pnl);
  if (absPnl >= 1_000_000)
    return `${sign}$${(absPnl / 1_000_000).toFixed(1)}M`;
  if (absPnl >= 1_000) return `${sign}$${(absPnl / 1_000).toFixed(0)}K`;
  return `${sign}$${absPnl.toFixed(0)}`;
}

/**
 * Format timestamp (ms) as relative time (e.g., just now, 5m ago, 2h ago, 3d ago)
 */
export function formatTimeAgo(timestampMs: number): string {
  const seconds = Math.floor((Date.now() / 1000 - timestampMs));
  if (seconds < 0) return "just now"; // Future timestamp edge case
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/**
 * Truncate wallet address for display (e.g., 0x1234...5678)
 */
export function formatAddress(address: string, prefixLen = 6, suffixLen = 4): string {
  if (address.length <= prefixLen + suffixLen + 3) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/**
 * Format points with locale formatting (e.g., 1,234)
 */
export function formatPoints(points: number): string {
  return Math.round(points).toLocaleString();
}
