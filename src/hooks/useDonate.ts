"use client";

import { useState, useCallback } from "react";
import { Contract, CallData } from "starknet";
import { useAccount } from "@starknet-react/core";
import { contractAddress, contractAbi, DONATION_TOKEN_ADDRESS, DONATION_TOKEN_SYMBOL, ERC20_ABI } from "@/constants";
import { splitU256 } from "@/lib/starknet";
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook for donating STRK (ERC-20) to an NFT owner on StarkNet.
 * Uses multicall: [approve STRK, donate] in a single transaction.
 */
export function useDonate() {
  const { account } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const donate = useCallback(
    async (tokenId: number, amountWei: bigint) => {
      if (!account) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your StarkNet wallet (ArgentX or Braavos).",
          variant: "destructive",
        });
        return;
      }
      if (!contractAddress) {
        toast({
          title: "Configuration Error",
          description: "Contract address is not set.",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsLoading(true);
        setIsConfirmed(false);
        setTxHash(null);

        toast({
          title: "📝 Preparing Transaction...",
          description: `Building multicall: approve ${DONATION_TOKEN_SYMBOL} + donate. Please wait.`,
        });

        const u256Amount = splitU256(amountWei);
        const u256TokenId = splitU256(BigInt(tokenId));

        // Multicall: approve + donate in one atomic transaction
        const calls = [
          {
            contractAddress: DONATION_TOKEN_ADDRESS,
            entrypoint: "approve",
            calldata: CallData.compile({
              spender: contractAddress,
              amount: u256Amount,
            }),
          },
          {
            contractAddress: contractAddress,
            entrypoint: "donate",
            calldata: CallData.compile({
              token_id: u256TokenId,
              amount: u256Amount,
            }),
          },
        ];

        toast({
          title: "🔐 Confirm in Wallet",
          description: "Please approve the transaction in your StarkNet wallet.",
        });

        const result = await account.execute(calls);
        setTxHash(result.transaction_hash);

        toast({
          title: "⏳ Transaction Submitted",
          description: `Tx: ${result.transaction_hash.slice(0, 10)}... Waiting for confirmation.`,
        });

        // Wait for confirmation
        await account.waitForTransaction(result.transaction_hash);
        setIsConfirmed(true);

        toast({
          title: "✅ Donation Successful!",
          description: "Thank you for supporting this creator on StarkNet!",
        });
      } catch (err: any) {
        console.error("Donation error:", err);
        const msg = err?.message || String(err);
        if (msg.includes("User abort") || msg.includes("rejected")) {
          toast({
            title: "Transaction Rejected",
            description: "You rejected the transaction in your wallet.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Donation Failed",
            description: msg.slice(0, 200),
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [account, toast]
  );

  return { donate, isLoading, txHash, isConfirmed };
}
