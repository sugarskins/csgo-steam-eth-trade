pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

contract CSGOSteamTrade {
    // 6 hours
    uint constant MINIMUM_PURCHASE_OFFER_AGE = 60 * 60 * 6;
    
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
    
    constructor() public {
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
        listing.purchaseOffer = PurchaseOffer(0, 0, '', false);
        listings[listingId] = listing;
    }

    function confirmPurchaseFulfilment(uint listingId) public {
        Listing memory listing = listings[listingId];
        require(listing.exists == true, "There is no listing to delete the purchase offer for.");
        require(listing.purchaseOffer.exists == true, "There is no purchase offer to delete for the listing.");
        require(listing.owner == msg.sender, "Only the owner can confirm purchase fulfilment");

        // request data from chainlink about whether purchase happened

    }

}