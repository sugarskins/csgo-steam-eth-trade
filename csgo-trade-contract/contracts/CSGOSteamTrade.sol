pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "chainlink/contracts/ChainlinkClient.sol";

contract CSGOSteamTrade is ChainlinkClient {
    // 6 hours
    uint public constant MINIMUM_PURCHASE_OFFER_AGE = 60 * 60 * 6;
    
    struct PurchaseOffer {
        address owner;
        uint creationTimestamp;
        string buyerSteamAccountName;
        bool exists;
    }

    struct Listing {
        uint listingId;
        string ownerSteamAccountName;
        uint marketId;
        string wear;
        string skinName;
        uint paintSeed;
        uint price;
        address sellerEthereumAdress;
        address owner;
        PurchaseOffer purchaseOffer;
        bool exists;
    }

    event ListingCreation(
        Listing listing
    );

    uint numListings = 0;
    mapping(uint => Listing) listings;
    
    /**
    * @notice Deploy the contract with a specified address for the LINK
    * and Oracle contract addresses
    * @dev Sets the storage for the specified addresses
    * @param _link The address of the LINK token contract
    */
    constructor(address _link) public {
        if (_link == address(0)) {
        setPublicChainlinkToken();
        } else {
        setChainlinkToken(_link);
        }
    }
    
    function createListing(string ownerSteamAccountName, uint marketId, string memory wear,
        string memory skinName, uint paintSeed, uint price, address sellerEthereumAdress) public returns (uint listingId) {

        PurchaseOffer memory placeholder = PurchaseOffer(0, 0, '', false);
        Listing memory listing = Listing(listingId, ownerSteamAccountName, marketId, wear, skinName, paintSeed,
            price, sellerEthereumAdress, msg.sender, placeholder, true);
        listingId = numListings++;
        emit ListingCreation(listing);
        listings[listingId] = listing;
    }
    
    function getListing(uint listingId) public view returns (Listing memory listing) {
        listing = listings[listingId];
    }

    function getListingsCount() public view returns (uint) {
        return numListings;
    }
    
    function deleteListing(uint listingId) public {
        Listing memory listing = listings[listingId];
        require(listing.exists == true,  "Listing does not exist.");
        require(listing.owner == msg.sender, "Only the owner can delete his listing.");

        if (listing.purchaseOffer.exists) {
            // return funds
            listing.purchaseOffer.owner.transfer(listing.price);
        }
        
        listings[listingId].exists = false;
    }

    function createPurchaseOffer(uint listingId, string buyerSteamAccountName) public payable {
        Listing memory listing = listings[listingId];
        require(listing.exists == true, "Listing does not exist.");
        require(listing.purchaseOffer.exists == false, "Listing already has a purchase offer.");
        require(listing.price == msg.value, "Value sent does not match listing price.");

        uint currentTimestamp = block.timestamp;
        PurchaseOffer memory purchaseOffer = PurchaseOffer(msg.sender, currentTimestamp, buyerSteamAccountName, true);
        listing.purchaseOffer = purchaseOffer;
        listings[listingId] = listing;
    }

    function deletePurchaseOffer(uint listingId) public {
        Listing memory listing = listings[listingId];
        require(listing.exists == true, "There is no listing to delete the purchase offer for.");
        require(listing.purchaseOffer.exists == true, "There is no purchase offer to delete for the listing.");
        require(listing.purchaseOffer.owner == msg.sender, "Only the owner can delete the purchase offer");

        uint secondsSinceOfferCreation = block.timestamp - listing.purchaseOffer.creationTimestamp;
        require(secondsSinceOfferCreation > MINIMUM_PURCHASE_OFFER_AGE, "The minimum block age requirement not met for deletion.");

        // send the funds back to the owner of the purchase offer.
        listing.purchaseOffer.owner.transfer(listing.price);

        listing.purchaseOffer = PurchaseOffer(0, 0, '', false);
        listings[listingId] = listing;
    }

    function createItemTransferConfirmationRequest(
        uint listingId,
        address _oracle,
        bytes32 _jobId,
        uint256 _payment,
        string _url,
        string _path)
        public
        returns (bytes32 requestId) {

        Listing memory listing = listings[listingId];
        require(listing.exists == true, "There is no listing to confirm transfer for.");
        require(listing.purchaseOffer.exists == true, "There is no purchase to offer to confirm transfer.");
        require(listing.owner == msg.sender, "Only the owner can confirm purchase fulfilment");
        
        Chainlink.Request memory req = buildChainlinkRequest(_jobId,
            this,
            this.fulfillItemTransferConfirmation.selector);
        req.add("url", _url);
        req.add("path", _path);
        requestId = sendChainlinkRequestTo(_oracle, req, _payment);
    }

    /**
   * @notice The fulfill method from requests created by this contract
   * @dev The recordChainlinkFulfillment protects this function from being called
   * by anyone other than the oracle address that the request was sent to
   * @param _requestId The ID that was generated for the request
   * @param _data The answer provided by the oracle
   */
    function fulfillItemTransferConfirmation(bytes32 _requestId, uint256 _data)
        public
        recordChainlinkFulfillment(_requestId)
    {
        
    }
}