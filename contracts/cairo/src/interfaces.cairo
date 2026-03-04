use starknet::ContractAddress;

#[starknet::interface]
pub trait INFTDonation<TContractState> {
    /// Mint a new NFT with a given token URI string.
    fn mint_nft(ref self: TContractState, token_uri: ByteArray) -> u256;

    /// Donate ETH (ERC-20) to the owner of the given token.
    /// The caller must have previously approved this contract to spend `amount`.
    fn donate(ref self: TContractState, token_id: u256, amount: u256);

    /// View: total supply of minted tokens.
    fn total_supply(self: @TContractState) -> u256;

    /// View: total donations received by a given token.
    fn get_total_donations(self: @TContractState, token_id: u256) -> u256;

    /// View: get the stored token URI (custom, not the base_uri + tokenId one).
    fn get_token_uri(self: @TContractState, token_id: u256) -> ByteArray;

    /// View: get the ETH token address used for donations.
    fn get_eth_address(self: @TContractState) -> ContractAddress;
}
