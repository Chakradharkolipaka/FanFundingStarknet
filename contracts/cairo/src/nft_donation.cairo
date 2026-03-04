/// Fan Funding NFT Donation Contract for StarkNet
/// Allows creators to mint ERC-721 NFTs and receive ETH (ERC-20) donations.
///
/// Key differences from the Solidity version:
/// - ETH on StarkNet is an ERC-20 token, so donations use approve + transfer_from
/// - Account abstraction is native: wallets can batch approve+donate in one tx
/// - u256 = { low: u128, high: u128 } internally
/// - Storage uses Map instead of Solidity mappings

#[starknet::contract]
mod NFTDonation {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::num::traits::Zero;
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 Mixin (includes IERC721, IERC721Metadata, IERC721CamelOnly)
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    /// STRK ERC-20 contract address on StarkNet (mainnet & sepolia)
    const STRK_CONTRACT_ADDRESS: felt252 = 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d;

    /// ETH ERC-20 contract address on StarkNet (kept for reference)
    const ETH_CONTRACT_ADDRESS: felt252 = 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7;

    // ────────────────── Storage ──────────────────

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        /// Auto-incrementing token ID counter
        token_counter: u256,
        /// Tracks total ETH donated per token ID
        total_donations: Map<u256, u256>,
        /// Stores token URI per token ID
        token_uris: Map<u256, ByteArray>,
    }

    // ────────────────── Events ──────────────────

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        DonationReceived: DonationReceived,
        NFTMinted: NFTMinted,
    }

    #[derive(Drop, starknet::Event)]
    struct DonationReceived {
        #[key]
        donor: ContractAddress,
        #[key]
        token_id: u256,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct NFTMinted {
        #[key]
        owner: ContractAddress,
        #[key]
        token_id: u256,
        token_uri: ByteArray,
    }

    // ────────────────── Constructor ──────────────────

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc721.initializer("Fan Funding NFT", "FANFUND", "");
        self.token_counter.write(0);
    }

    // ────────────────── External Functions ──────────────────

    #[abi(embed_v0)]
    impl NFTDonationImpl of super::super::interfaces::INFTDonation<ContractState> {
        /// Mint a new NFT to the caller with the provided IPFS token URI.
        fn mint_nft(ref self: ContractState, token_uri: ByteArray) -> u256 {
            let caller = get_caller_address();
            let current_counter = self.token_counter.read();
            let new_token_id = current_counter + 1;

            // Mint the token
            self.erc721.mint(caller, new_token_id);

            // Store token URI
            self.token_uris.write(new_token_id, token_uri.clone());

            // Increment counter
            self.token_counter.write(new_token_id);

            // Emit event
            self.emit(NFTMinted {
                owner: caller,
                token_id: new_token_id,
                token_uri,
            });

            new_token_id
        }

        /// Donate STRK to the owner of a specific NFT.
        /// Requires the caller to have approved this contract to spend `amount` STRK.
        fn donate(ref self: ContractState, token_id: u256, amount: u256) {
            // Validate token exists
            let token_owner = self.erc721.owner_of(token_id);
            assert(!token_owner.is_zero(), 'Token does not exist');

            // Validate amount
            assert(amount > 0, 'Amount must be > 0');

            let caller = get_caller_address();

            // Transfer STRK from donor to token owner via ERC-20 transfer_from
            let strk_address: ContractAddress = STRK_CONTRACT_ADDRESS.try_into().unwrap();
            let strk_dispatcher = IERC20Dispatcher { contract_address: strk_address };
            let success = strk_dispatcher.transfer_from(caller, token_owner, amount);
            assert(success, 'STRK transfer failed');

            // Track donation
            let current_total = self.total_donations.read(token_id);
            self.total_donations.write(token_id, current_total + amount);

            // Emit event
            self.emit(DonationReceived {
                donor: caller,
                token_id,
                amount,
            });
        }

        /// Returns the total number of minted tokens.
        fn total_supply(self: @ContractState) -> u256 {
            self.token_counter.read()
        }

        /// Returns the total donations for a specific token.
        fn get_total_donations(self: @ContractState, token_id: u256) -> u256 {
            self.total_donations.read(token_id)
        }

        /// Returns the stored token URI for a given token.
        fn get_token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            self.token_uris.read(token_id)
        }

        /// Returns the STRK ERC-20 contract address (donation token).
        fn get_eth_address(self: @ContractState) -> ContractAddress {
            STRK_CONTRACT_ADDRESS.try_into().unwrap()
        }
    }

    // ────────────────── ERC-20 Interface (for STRK transfers) ──────────────────

    #[starknet::interface]
    trait IERC20<TContractState> {
        fn transfer_from(
            ref self: TContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) -> bool;
        fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
        fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    }
}
