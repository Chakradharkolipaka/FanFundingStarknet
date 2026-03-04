import abi from "../../contracts/starknet_abi.json";

/** StarkNet contract address — set via NEXT_PUBLIC_CONTRACT_ADDRESS env var */
export const contractAddress: string | undefined = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

/** Sierra ABI for the NFTDonation cairo contract */
export const contractAbi = abi;

/** STRK ERC-20 contract on StarkNet (same on mainnet & sepolia) — used for donations */
export const STRK_TOKEN_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

/** ETH ERC-20 contract on StarkNet (same on mainnet & sepolia) */
export const ETH_TOKEN_ADDRESS =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

/** The token used for donations (STRK) */
export const DONATION_TOKEN_ADDRESS = STRK_TOKEN_ADDRESS;
export const DONATION_TOKEN_SYMBOL = "STRK";

/** Minimal ERC-20 ABI for approve / balance_of calls */
export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "balance_of",
    inputs: [
      { name: "account", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "transfer_from",
    inputs: [
      { name: "sender", type: "core::starknet::contract_address::ContractAddress" },
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
] as const;

/** StarkNet Sepolia network config */
export const STARKNET_CHAIN_ID = "SN_SEPOLIA";
export const STARKNET_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/t_rhMdgBYIyrHkpDdOkWo";
export const VOYAGER_BASE_URL = "https://sepolia.voyager.online";
export const STARKSCAN_BASE_URL = "https://sepolia.starkscan.co";
