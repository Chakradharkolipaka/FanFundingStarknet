"use client";

import { useState, useCallback } from "react";
import { CallData } from "starknet";
import { useAccount } from "@starknet-react/core";
import { contractAddress, contractAbi } from "@/constants";
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook for minting an NFT on StarkNet.
 * 1. Uploads image + metadata to IPFS via API route
 * 2. Calls mint_nft(token_uri) on the StarkNet contract
 */
export function useMintNFT() {
  const { account } = useAccount();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const mint = useCallback(
    async (file: File, name: string, description: string) => {
      if (!account) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your StarkNet wallet first.",
          variant: "destructive",
        });
        return;
      }

      if (!contractAddress) {
        toast({
          title: "Configuration Error",
          description: "Contract address is not configured.",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsConfirmed(false);
        setTxHash(null);

        // ── Step 1: Upload to IPFS ──
        setIsUploading(true);
        toast({
          title: "📤 Uploading to IPFS...",
          description: "Uploading your image and metadata to decentralized storage.",
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name);
        formData.append("description", description);

        const uploadRes = await fetch("/api/pinata/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(errData.error || `Upload failed (${uploadRes.status})`);
        }

        const { tokenURI } = await uploadRes.json();
        if (!tokenURI) throw new Error("No token URI returned from IPFS upload");

        setIsUploading(false);
        toast({
          title: "✅ Upload Complete",
          description: "Metadata stored on IPFS. Now minting your NFT...",
        });

        // ── Step 2: Mint on StarkNet ──
        setIsMinting(true);
        toast({
          title: "🔐 Confirm in Wallet",
          description: "Please approve the mint transaction in your StarkNet wallet.",
        });

        const call = {
          contractAddress: contractAddress,
          entrypoint: "mint_nft",
          calldata: CallData.compile({ token_uri: tokenURI }),
        };

        const result = await account.execute([call]);
        setTxHash(result.transaction_hash);
        setIsMinting(false);

        // ── Step 3: Wait for confirmation ──
        setIsConfirming(true);
        toast({
          title: "⏳ Waiting for Confirmation...",
          description: `Tx: ${result.transaction_hash.slice(0, 10)}... Confirming on StarkNet.`,
        });

        await account.waitForTransaction(result.transaction_hash);
        setIsConfirmed(true);

        toast({
          title: "🎉 NFT Minted Successfully!",
          description: "Your NFT is now live on StarkNet. View it on the home page!",
        });
      } catch (err: any) {
        console.error("Mint error:", err);
        const msg = err?.message || String(err);
        if (msg.includes("User abort") || msg.includes("rejected")) {
          toast({
            title: "Transaction Rejected",
            description: "You rejected the transaction.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Minting Failed",
            description: msg.slice(0, 200),
            variant: "destructive",
          });
        }
      } finally {
        setIsUploading(false);
        setIsMinting(false);
        setIsConfirming(false);
      }
    },
    [account, toast]
  );

  const isProcessing = isUploading || isMinting || isConfirming;

  return { mint, isUploading, isMinting, isConfirming, isConfirmed, isProcessing, txHash };
}
