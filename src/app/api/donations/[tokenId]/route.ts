import { NextResponse } from "next/server";
import { RpcProvider, hash, num } from "starknet";

const STARKNET_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://starknet-sepolia.public.blastapi.io";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

// Event key for DonationReceived
const DONATION_EVENT_KEY = hash.getSelectorFromName("DonationReceived");

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = parseInt(params.tokenId);
    if (isNaN(tokenId)) {
      return NextResponse.json({ error: "Invalid token ID" }, { status: 400 });
    }

    if (!CONTRACT_ADDRESS) {
      return NextResponse.json({ error: "Contract address not configured" }, { status: 500 });
    }

    const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });

    // Fetch events from StarkNet using getEvents
    const eventsResponse = await provider.getEvents({
      address: CONTRACT_ADDRESS,
      keys: [[DONATION_EVENT_KEY]],
      from_block: { block_number: 0 },
      to_block: "latest",
      chunk_size: 100,
    });

    const donations: Array<{
      donor: string;
      amount: string;
      blockNumber: number;
      transactionHash: string;
    }> = [];

    for (const event of eventsResponse.events) {
      // DonationReceived event keys: [event_selector, donor, token_id_low, token_id_high]
      // DonationReceived event data: [amount_low, amount_high]
      if (event.keys.length >= 4 && event.data.length >= 2) {
        const eventTokenIdLow = num.toBigInt(event.keys[2]);
        const eventTokenIdHigh = num.toBigInt(event.keys[3]);
        const eventTokenId = eventTokenIdLow + (eventTokenIdHigh << 128n);

        if (Number(eventTokenId) === tokenId) {
          const donor = event.keys[1]; // donor address
          const amountLow = num.toBigInt(event.data[0]);
          const amountHigh = num.toBigInt(event.data[1]);
          const amount = amountLow + (amountHigh << 128n);

          donations.push({
            donor,
            amount: amount.toString(),
            blockNumber: event.block_number ?? 0,
            transactionHash: event.transaction_hash,
          });
        }
      }
    }

    return NextResponse.json(donations);
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}
