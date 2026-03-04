# Fan Funding Platform on StarkNet

A decentralized fan funding platform built on **StarkNet** where creators can mint NFTs and receive direct ETH donations from their supporters. Powered by Cairo smart contracts with native Account Abstraction.

## 🚀 Network & Contract Info

- **Network**: StarkNet Sepolia (Testnet)
- **Contract Language**: Cairo 2.x
- **Token Standard**: ERC-721 (OpenZeppelin Cairo)
- **Donation Method**: Multicall (approve ETH + donate in one transaction)

## 🔑 Supported Wallets

| Wallet | Type | Install |
|--------|------|---------|
| **ArgentX** | Browser Extension | [argent.xyz/argent-x](https://www.argent.xyz/argent-x/) |
| **Braavos** | Browser Extension | [braavos.app](https://braavos.app/) |

## 💧 Testnet Faucets (StarkNet Sepolia)

| Faucet | URL |
|--------|-----|
| StarkNet Faucet | [starknet-faucet.vercel.app](https://starknet-faucet.vercel.app/) |
| Blast API Faucet | [blastapi.io/faucets/starknet-sepolia-eth](https://blastapi.io/faucets/starknet-sepolia-eth) |
| Alchemy Faucet | [alchemy.com/faucets/starknet-sepolia](https://www.alchemy.com/faucets/starknet-sepolia) |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Smart Contracts**: Cairo 2.x (Scarb + Starkli)
- **Blockchain**: StarkNet (Ethereum Layer 2, ZK-Rollup)
- **Wallet Integration**: @starknet-react/core, get-starknet
- **JS Library**: starknet.js
- **Storage**: IPFS via Pinata
- **Animations**: Framer Motion, react-confetti

## 📦 Installation

```bash
npm install --legacy-peer-deps
```

## 🔧 Development

```bash
npm run dev
```

## 🔗 Smart Contract (Cairo)

Build and deploy the Cairo contract:

```bash
# Install Scarb (Cairo package manager)
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh

# Install Starkli (CLI deployment tool)
curl https://get.starkli.sh | sh

# Build
cd contracts/cairo
scarb build

# Declare (upload bytecode)
starkli declare target/dev/fan_funding_starknet_NFTDonation.contract_class.json \
  --rpc https://starknet-sepolia.public.blastapi.io \
  --account <your_account_file>

# Deploy (instantiate)
starkli deploy <class_hash> \
  --rpc https://starknet-sepolia.public.blastapi.io \
  --account <your_account_file>
```

## 🌐 Environment Variables

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...        # Deployed StarkNet contract address
NEXT_PUBLIC_RPC_URL=https://starknet-sepolia.public.blastapi.io
PINATA_JWT=...                            # Server-side Pinata JWT
NEXT_PUBLIC_PINATA_JWT=...                # Client-side Pinata JWT (if needed)
```

## 🌐 Deployment

The app is deployed on Vercel:

```bash
npm run build
```

## 🔍 Block Explorers

- [Voyager (Sepolia)](https://sepolia.voyager.online)
- [StarkScan (Sepolia)](https://sepolia.starkscan.co)

