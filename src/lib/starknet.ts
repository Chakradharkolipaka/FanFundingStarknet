import { RpcProvider } from "starknet";
import { STARKNET_RPC_URL } from "@/constants";

/** Singleton StarkNet RPC provider for read-only calls & event fetching */
let _provider: RpcProvider | null = null;

export function getProvider(): RpcProvider {
  if (!_provider) {
    _provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
  }
  return _provider;
}

/**
 * Convert a u256 value (which may come as {low, high} or bigint) to a bigint.
 */
export function toU256BigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  if (value && typeof value === "object" && "low" in value && "high" in value) {
    const v = value as { low: bigint | string | number; high: bigint | string | number };
    return BigInt(v.low) + (BigInt(v.high) << 128n);
  }
  return 0n;
}

/**
 * Convert a bigint to { low, high } for StarkNet u256 calls.
 */
export function splitU256(value: bigint): { low: string; high: string } {
  const mask = (1n << 128n) - 1n;
  return {
    low: "0x" + (value & mask).toString(16),
    high: "0x" + ((value >> 128n) & mask).toString(16),
  };
}

/**
 * Format a StarkNet felt252 address to a shortened form.
 */
export function shortenAddress(address: string): string {
  if (!address) return "";
  const clean = address.toLowerCase();
  if (clean.length <= 12) return clean;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

/**
 * Format wei (10^18) to a human-readable ETH string.
 */
export function formatEth(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  const fracStr = frac.toString().padStart(18, "0").slice(0, 6).replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

/**
 * Parse ETH string to wei bigint.
 */
export function parseEth(eth: string): bigint {
  const parts = eth.split(".");
  const whole = BigInt(parts[0] || "0") * 10n ** 18n;
  if (!parts[1]) return whole;
  const fracStr = parts[1].padEnd(18, "0").slice(0, 18);
  return whole + BigInt(fracStr);
}
