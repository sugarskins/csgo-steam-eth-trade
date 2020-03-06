pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "chainlink/v0.5/contracts/ChainlinkClient.sol";
import "chainlink/v0.5/contracts/vendor/Ownable.sol";


contract CSGOSteamTrade is ChainlinkClient, Ownable {
    uint private constant hour = 60 * 60;
    uint public constant MINIMUM_PURCHASE_OFFER_AGE = hour * 6;
    string public constant CHECK_INVENTORY_CONTAINS_ITEM_METHOD = "tradeurlownerhasinspectlinktarget";

    uint256 constant public OWNERSHIP_STATUS_FALSE = 0;
    uint256 constant public OWNERSHIP_STATUS_TRUE = 1;
    uint256 constant public OWNERSHIP_STATUS_INVENTORY_PRIVATE = 2;

    string constant ERR_LISTING_NOT_FOUND = "Listing not found";
    
    struct PurchaseOffer {
        address payable owner;
        uint creationTimestamp;
        string buyerTradeURL;
        bool exists;
    }

    struct Listing {
        uint listingId;
        string ownerInspectLink;
        string wear;
        string skinName;
        uint paintSeed;
        string extraItemData;
        uint price;
        address payable sellerAddress;
        PurchaseOffer purchaseOffer;
        bool exists;
    }

    event ListingCreation(
        Listing listing
    );

    event PurchaseOfferMade(
        string indexed buyerTradeURL,
        address indexed buyerAddress,
        Listing listing
    );

    enum TradeOutcome { SUCCESSFULLY_CONFIRMED, UNABLE_TO_CONFIRM_PRIVATE_PROFILE, DELETED_LISTING }

    event TradeDone (
        string indexed buyerTradeURL,
        address indexed buyerAddress,
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
    
    function createListing(string memory _ownerInspectLink, string memory _wear,
        string memory _skinName, uint _paintSeed, string memory _extraItemData,
        uint _price, address payable _sellerAddress)
        public
        onlyOwner
        returns (uint listingId) {
        listingId = numListings++;
        PurchaseOffer memory emptyOffer;
        Listing memory listing = Listing(listingId, _ownerInspectLink, _wear, _skinName, _paintSeed, _extraItemData,
            _price, _sellerAddress, emptyOffer, true);
        emit ListingCreation(listing);
        listings[listingId] = listing;
    }
    
    function getListing(uint _listingId) public view returns (Listing memory listing) {
        listing = listings[_listingId];
    }

    function getListingsCount() public view returns (uint) {
        return numListings;
    }
    
    function deleteListing(uint _listingId)
        public
        onlyOwner {
        Listing memory listing = listings[_listingId];
        require(listing.exists == true, ERR_LISTING_NOT_FOUND);

        if (listing.purchaseOffer.exists) {
            // return funds
            listing.purchaseOffer.owner.transfer(listing.price);
            emit TradeDone(listing.purchaseOffer.buyerTradeURL, listing.purchaseOffer.owner, listing, TradeOutcome.DELETED_LISTING);
        } else {
            emit TradeDone("", address(0), listing, TradeOutcome.DELETED_LISTING);
        }
        
        listings[_listingId].exists = false;
    }

    function createPurchaseOffer(uint _listingId, string memory _buyerTradeURL) public payable {
        Listing memory listing = listings[_listingId];
        require(listing.exists == true, ERR_LISTING_NOT_FOUND);
        require(listing.purchaseOffer.exists == false, "Listing already has a purchase offer");
        require(listing.price == msg.value, "Price and value do not match");

        uint currentTimestamp = block.timestamp;
        PurchaseOffer memory purchaseOffer = PurchaseOffer(msg.sender, currentTimestamp, _buyerTradeURL, true);
        listing.purchaseOffer = purchaseOffer;

        emit PurchaseOfferMade(_buyerTradeURL, msg.sender, listing);
        listings[_listingId] = listing;
    }

    function deletePurchaseOffer(uint _listingId) public {
        Listing memory listing = listings[_listingId];
        require(listing.exists == true, ERR_LISTING_NOT_FOUND);
        require(listing.purchaseOffer.exists == true, "Purchase offer does not exist");
        require(listing.purchaseOffer.owner == msg.sender, "Only the owner can delete the purchase offer");


        uint secondsSinceOfferCreation = block.timestamp - listing.purchaseOffer.creationTimestamp;
        require(secondsSinceOfferCreation > MINIMUM_PURCHASE_OFFER_AGE, "The minimum block age requirement not met for deletion");

        // send the funds back to the owner of the purchase offer.
        listing.purchaseOffer.owner.transfer(listing.price);

        listing.purchaseOffer.exists = false;
        listings[_listingId] = listing;
    }

    function createItemTransferConfirmationRequest(
        uint _listingId,
        address _oracle,
        bytes32 _jobId,
        uint256 _payment,
        string memory _buyerInspectLink)
        public
        onlyOwner
        returns (bytes32 requestId) {

        Listing memory listing = listings[_listingId];
        require(listing.exists == true, ERR_LISTING_NOT_FOUND);
        require(listing.purchaseOffer.exists == true, "The listing has not yet received an offer.");
        
        Chainlink.Request memory req = buildChainlinkRequest(_jobId,
            address(this),
            this.fulfillItemTransferConfirmation.selector);
            
        req.add("method", CHECK_INVENTORY_CONTAINS_ITEM_METHOD);
        req.add("inspectLink", _buyerInspectLink);
        req.add("tradeURL", listing.purchaseOffer.buyerTradeURL);
        req.add("wear", listing.wear);
        req.add("skinName", listing.skinName);
        req.add("paintSeed", uint2str(listing.paintSeed));
        
        string[] memory path = new string[](1);
        path[0] = "containsItem";
        req.addStringArray("copyPath", path);

        requestId = sendChainlinkRequestTo(_oracle, req, _payment);
        requestIdToListingId[requestId] = _listingId;
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
        require(listing.exists == true, ERR_LISTING_NOT_FOUND);
        require(listing.purchaseOffer.exists == true, "Listing has no purchase offer");

        if (_ownershipStatus == OWNERSHIP_STATUS_TRUE) {
            listing.sellerAddress.transfer(listing.price);
            emit TradeDone(listing.purchaseOffer.buyerTradeURL, listing.purchaseOffer.owner, listing, TradeOutcome.SUCCESSFULLY_CONFIRMED);
            listings[listingId].exists = false;
        } else if (_ownershipStatus == OWNERSHIP_STATUS_INVENTORY_PRIVATE) {
            listing.sellerAddress.transfer(listing.price);
            emit TradeDone(listing.purchaseOffer.buyerTradeURL, listing.purchaseOffer.owner, listing, TradeOutcome.UNABLE_TO_CONFIRM_PRIVATE_PROFILE);
            listings[listingId].exists = false;
        } else if (_ownershipStatus == OWNERSHIP_STATUS_FALSE) {
            emit TradeFulfilmentFail(listing);
        } else {
            require(false, 'ownershipStatus has an unsupported value');
        }
    }

    /**
    * @notice Call this method if no response is received within 5 minutes
    * @param _requestId The ID that was generated for the request to cancel
    * @param _payment The payment specified for the request to cancel
    * the request to cancel
    * @param _expiration The expiration generated for the request to cancel
    */
    function cancelRequest(
        bytes32 _requestId,
        uint256 _payment,
        uint256 _expiration
    )
        public
        onlyOwner {
        cancelChainlinkRequest(_requestId, _payment, this.fulfillItemTransferConfirmation.selector, _expiration);
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