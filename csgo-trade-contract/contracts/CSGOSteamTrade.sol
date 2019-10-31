pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

contract CSGOSteamTrade {
    
    struct PurchaseOffer {
        address owner;
        uint creationBlock;
        bool exists;
    }

    struct Listing {
        uint listingId;
        uint marketId;
        string wear;
        string skinName;
        uint price;
        address sellerEthereumAdress;
        address owner;
        bool exists;
        PurchaseOffer purchaseOffer;
    }

    event ListingCreation(
        Listing listing
    );

    uint numListings = 0;
    mapping(uint => Listing) listings;
    
    constructor() public {
    }
    
    function createListing(uint marketId, string memory wear,
        string memory skinName, uint price, address sellerEthereumAdress) public returns (uint listingId) {

        PurchaseOffer memory placeholder = PurchaseOffer(0, 0, false);
        Listing memory listing = Listing(listingId, marketId, wear, skinName,
            price, sellerEthereumAdress, msg.sender, true, placeholder);
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

    function createPurchaseOffer(uint listingId) public payable {
        Listing memory listing = listings[listingId];
        require(listing.exists == true, "Listing does not exist.");
        require(listing.purchaseOffer.exists == false, "Listing already has a purchase offer.");
        require(listing.price == msg.value, "Value sent does not match listing price.");
        uint currentBlock = block.number;
        PurchaseOffer memory purchaseOffer = PurchaseOffer(msg.sender, currentBlock, true);
        listing.purchaseOffer = purchaseOffer;
        listings[listingId] = listing;
    }

    uint constant minimumPurchaseOfferBlockAge = 1000;

    function deletePurchaseOffer(uint listingId) public {
        Listing memory listing = listings[listingId];
        require(listing.exists == true, "There is no listing to delete the purchase offer for.");
        require(listing.purchaseOffer.exists == true, "There is no purchase offer to delete for the listing.");
        require(listing.purchaseOffer.owner == msg.sender, "Only the owner can delete the purchase offer");
        uint blocksSince = listing.purchaseOffer.creationBlock;
        require(blocksSince > minimumPurchaseOfferBlockAge, "The minimum block age requirement not met for deletion.");
        listing.purchaseOffer = PurchaseOffer(0, 0, false);
        listings[listingId] = listing;
    }

}