pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "chainlink/contracts/ChainlinkClient.sol";


contract CSGOSteamTrade is ChainlinkClient {
    // 6 hours
    uint public constant MINIMUM_PURCHASE_OFFER_AGE = 60 * 60 * 6;
    string public constant CHECK_INVENTORY_CONTAINS_ITEM_METHOD = "checkinventorycontainscsgoweapon";
    uint256 constant private ORACLE_PAYMENT = 1 * LINK;

    uint256 constant public OWNERSHIP_STATUS_FALSE = 0;
    uint256 constant public OWNERSHIP_STATUS_TRUE = 1;
    uint256 constant public OWNERSHIP_STATUS_INVENTORY_PRIVATE = 2;

    enum ListingStage {OPEN, RECEIVED_OFFER, PENDING_TRANSFER_CONFIRMATON, DONE }
    
    struct PurchaseOffer {
        address owner;
        uint creationTimestamp;
        string buyerSteamAccountName;
        bool exists;
    }

    struct Listing {
        uint listingId;
        string ownerSteamAccountName;
        uint accountSteamId;
        string wear;
        string skinName;
        uint paintSeed;
        uint price;
        address sellerEthereumAdress;
        address owner;
        PurchaseOffer purchaseOffer;
        bool exists;
        ListingStage stage;
    }

    event ListingCreation(
        Listing listing
    );

    enum TradeOutcome { SUCCESSFULLY_CONFIRMED, UNABLE_TO_CONFIRM_PRIVATE_PROFILE }

    event TradeDone (
        Listing listing,
        TradeOutcome tradeOutcome
    );

    event TradeFulfilmentFail (
        Listing listing
    );

    uint numListings = 0;
    mapping(uint => Listing) listings;

    mapping(bytes32 => uint) requestIdToListingId;
    
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
    
    function createListing(string _ownerSteamAccountName, uint _accountSteamId, string memory _wear,
        string memory _skinName, uint _paintSeed, uint _price, address _sellerEthereumAdress) public returns (uint listingId) {

        PurchaseOffer memory placeholder = PurchaseOffer(0, 0, '', false);
        Listing memory listing = Listing(listingId, _ownerSteamAccountName, _accountSteamId, _wear, _skinName, _paintSeed,
            _price, _sellerEthereumAdress, msg.sender, placeholder, true, ListingStage.OPEN);
        listingId = numListings++;
        emit ListingCreation(listing);
        listings[listingId] = listing;
    }
    
    function getListing(uint _listingId) public view returns (Listing memory listing) {
        listing = listings[_listingId];
    }

    function getListingsCount() public view returns (uint) {
        return numListings;
    }
    
    function deleteListing(uint _listingId) public {
        Listing memory listing = listings[_listingId];
        require(listing.exists == true,  "Listing does not exist.");
        require(listing.owner == msg.sender, "Only the owner can delete his listing.");

        if (listing.purchaseOffer.exists) {
            // return funds
            listing.purchaseOffer.owner.transfer(listing.price);
        }
        
        listings[_listingId].exists = false;
    }

    function createPurchaseOffer(uint _listingId, string buyerSteamAccountName) public payable {
        Listing memory listing = listings[_listingId];
        require(listing.exists == true, "Listing does not exist.");
        require(listing.stage == ListingStage.OPEN, "Listing is not open for offers.");
        require(listing.purchaseOffer.exists == false, "Listing already has a purchase offer.");
        require(listing.price == msg.value, "Value sent does not match listing price.");

        uint currentTimestamp = block.timestamp;
        PurchaseOffer memory purchaseOffer = PurchaseOffer(msg.sender, currentTimestamp, buyerSteamAccountName, true);
        listing.purchaseOffer = purchaseOffer;
        listing.stage = ListingStage.RECEIVED_OFFER;
        listings[_listingId] = listing;
    }

    function deletePurchaseOffer(uint _listingId) public {
        Listing memory listing = listings[_listingId];
        require(listing.exists == true, "There is no listing to delete the purchase offer for.");
        require(listing.purchaseOffer.exists == true, "There is no purchase offer to delete for the listing.");
        require(listing.purchaseOffer.owner == msg.sender, "Only the owner can delete the purchase offer");

        uint secondsSinceOfferCreation = block.timestamp - listing.purchaseOffer.creationTimestamp;
        require(secondsSinceOfferCreation > MINIMUM_PURCHASE_OFFER_AGE, "The minimum block age requirement not met for deletion.");

        // send the funds back to the owner of the purchase offer.
        listing.purchaseOffer.owner.transfer(listing.price);

        listing.purchaseOffer = PurchaseOffer(0, 0, '', false);
        listing.stage = ListingStage.OPEN;
        listings[_listingId] = listing;
    }

    function createItemTransferConfirmationRequest(
        uint _listingId,
        address _oracle,
        bytes32 _jobId,
        uint256 _payment,
        string _url,
        string _path)
        public
        returns (bytes32 requestId) {

        Listing memory listing = listings[_listingId];
        require(listing.exists == true, "There is no listing to confirm transfer for.");
        require(listing.stage == ListingStage.RECEIVED_OFFER, "The listing has not yet received an offer.");
        require(listing.purchaseOffer.exists == true, "There is no purchase offer present.");
        require(listing.owner == msg.sender, "Only the owner can confirm purchase fulfilment");
        
        Chainlink.Request memory req = buildChainlinkRequest(_jobId,
            this,
            this.fulfillItemTransferConfirmation.selector);
            
        req.add("method", CHECK_INVENTORY_CONTAINS_ITEM_METHOD);
        req.add("accountName", listing.ownerSteamAccountName);
        req.add("steamId", uint2str(listing.accountSteamId));
        req.add("wear", listing.wear);
        req.add("skinName", listing.skinName);
        req.add("paintSeed", uint2str(listing.paintSeed));
        
        string[] memory path = new string[](1);
        path[0] = "containsItem";
        req.addStringArray("copyPath", path);

        requestId = sendChainlinkRequestTo(_oracle, req, _payment);
        requestIdToListingId[requestId] = _listingId;

        listing.stage = ListingStage.PENDING_TRANSFER_CONFIRMATON;
        listings[_listingId] = listing;
    }

    /**
   * @notice The fulfill method from requests created by this contract
   * @dev The recordChainlinkFulfillment protects this function from being called
   * by anyone other than the oracle address that the request was sent to
   * @param _requestId The ID that was generated for the request
   * @param _ownershipStatus The answer provided by the oracle
   */
    function fulfillItemTransferConfirmation(bytes32 _requestId, uint256 _ownershipStatus)
        public
        recordChainlinkFulfillment(_requestId) {
        uint listingId = requestIdToListingId[_requestId];
        Listing memory listing = listings[listingId];
        require(listing.exists == true, "There is no listing with that id.");
        require(listing.stage == ListingStage.PENDING_TRANSFER_CONFIRMATON, "Listing is not pending transfer confirmation.");
        require(_ownershipStatus >= 0 && _ownershipStatus <= 2, "_ownershipStatus is not within the known range of values");

        if (_ownershipStatus == OWNERSHIP_STATUS_TRUE) {
            listing.stage = ListingStage.DONE;
            listing.sellerEthereumAdress.transfer(listing.price);
            emit TradeDone(listing, TradeOutcome.SUCCESSFULLY_CONFIRMED);
        } else if (_ownershipStatus == OWNERSHIP_STATUS_INVENTORY_PRIVATE) {
            listing.stage = ListingStage.DONE;
            listing.sellerEthereumAdress.transfer(listing.price);
            emit TradeDone(listing, TradeOutcome.UNABLE_TO_CONFIRM_PRIVATE_PROFILE);
        } else if (_ownershipStatus == OWNERSHIP_STATUS_FALSE) {
            emit TradeFulfilmentFail(listing);
        }
        
        listings[listingId] = listing;
    }

    /**
     * @notice Converts a uint to a string. Extracted from https://github.com/provable-things/ethereum-api/blob/master/oraclizeAPI_0.5.sol
     */
    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }
}