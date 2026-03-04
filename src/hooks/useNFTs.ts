"use client";

import { useState, useEffect, useCallback } from "react";
import { Contract } from "starknet";
import { contractAddress, contractAbi } from "@/constants";
import { getProvider, toU256BigInt } from "@/lib/starknet";

export interface NftData {
  tokenId: number;
  metadata: Record<string, any>;
  owner: string;
  totalDonations: bigint;
}

/**
 * Hook to fetch all NFTs from the StarkNet contract.
 * Reads total_supply, then batch-fetches token_uri, owner_of, get_total_donations.
 */
export function useNFTs() {
  const [nfts, setNfts] = useState<NftData[]>([]);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!contractAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const provider = getProvider();
      const contract = new Contract(contractAbi, contractAddress, provider);

      // 1. Get total supply
      const supplyResult = await contract.call("total_supply");
      const supply = Number(toU256BigInt(supplyResult));
      setTotalSupply(supply);

      if (supply === 0) {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch data for each token
      const nftPromises = Array.from({ length: supply }, async (_, i) => {
        const tokenId = i + 1;
        try {
          const [uriResult, ownerResult, donationsResult] = await Promise.all([
            contract.call("get_token_uri", [{ low: tokenId, high: 0 }]),
            contract.call("owner_of", [{ low: tokenId, high: 0 }]),
            contract.call("get_total_donations", [{ low: tokenId, high: 0 }]),
          ]);

          // Parse token URI (ByteArray from Cairo)
          const tokenUri = typeof uriResult === "string" ? uriResult : String(uriResult);
          const owner = typeof ownerResult === "string"
            ? ownerResult
            : "0x" + BigInt(ownerResult as any).toString(16);
          const totalDonations = toU256BigInt(donationsResult);

          // Fetch metadata from IPFS
          let metadata: Record<string, any> = {};
          try {
            const res = await fetch(tokenUri);
            metadata = await res.json();
          } catch {
            console.warn(`Failed to fetch metadata for token ${tokenId}`);
          }

          return { tokenId, metadata, owner, totalDonations } as NftData;
        } catch (err) {
          console.error(`Error fetching NFT #${tokenId}:`, err);
          return { tokenId, metadata: {}, owner: "", totalDonations: 0n } as NftData;
        }
      });

      const results = await Promise.all(nftPromises);
      setNfts(results);
    } catch (err) {
      console.error("Failed to fetch NFTs:", err);
      setError(err instanceof Error ? err.message : "Failed to load NFTs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return { nfts, totalSupply, isLoading, error, refetch: fetchNFTs };
}
