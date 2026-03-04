"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, LogOut, ExternalLink, Copy, Check } from "lucide-react";
import { shortenAddress } from "@/lib/starknet";

export default function ConnectWallet() {
  const { address, isConnected, status } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = async (connector: any) => {
    try {
      toast({
        title: "🔗 Connecting Wallet...",
        description: `Connecting via ${connector.name}. Please approve in your wallet.`,
      });
      connect({ connector });
      setOpen(false);
      toast({
        title: "✅ Wallet Connected",
        description: "Your StarkNet wallet is now connected!",
      });
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err?.message || "Failed to connect wallet.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast({ title: "📋 Address Copied", description: "Wallet address copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyAddress}
          className="font-mono text-xs transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md"
        >
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {shortenAddress(address)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="transition-all duration-200 ease-in-out hover:scale-105 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
          size="sm"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Connect StarkNet Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to the StarkNet network.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              variant="outline"
              className="w-full justify-start gap-3 h-14 text-left transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md hover:border-primary/50"
              onClick={() => handleConnect(connector)}
            >
              {connector.icon && (
                <img
                  src={typeof connector.icon === 'string' ? connector.icon : connector.icon.dark || ''}
                  alt={connector.name}
                  className="h-7 w-7 rounded"
                />
              )}
              <div className="flex flex-col">
                <span className="font-medium">{connector.name}</span>
                <span className="text-xs text-muted-foreground">Click to connect</span>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-6 rounded-lg border bg-muted/50 p-4 space-y-2">
          <h4 className="text-sm font-semibold">🔑 Supported Wallets</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>🦊 ArgentX</span>
              <a
                href="https://www.argent.xyz/argent-x/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Install <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span>🛡️ Braavos</span>
              <a
                href="https://braavos.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Install <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <h4 className="text-sm font-semibold pt-2">💧 StarkNet Sepolia Faucets</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>StarkNet Faucet</span>
              <a
                href="https://starknet-faucet.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Get STRK <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span>Blast Faucet</span>
              <a
                href="https://blastapi.io/faucets/starknet-sepolia-eth"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Get STRK <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span>Alchemy Faucet</span>
              <a
                href="https://www.alchemy.com/faucets/starknet-sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Get STRK <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
