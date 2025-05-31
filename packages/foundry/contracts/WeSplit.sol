//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "forge-std/console.sol"; // Useful for debugging. Remove when deploying to a live network.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract WeSplit {
    IPyth pyth;

    struct Contributor {
        string username; // To identify between different users
        uint256 contributed; // Amount of assets contributed so far in the requested token
        uint256 withdrawn; // Amount of assets that have been withdrawn by the requester
        uint256 toContribute; // The fiat value that must be fulfilled (owed)
    }
    struct Split {
        address requesterAddress; // The requester address aka the person who has paid in fiat
        address tokenAddress; // The address of the token that they want to receive
        uint256 fiatAmount; // The amount of fiat they have spent (probably don't even need this since we store the toContribute in each Contributor)
        string currency; // The fiat currency used to pay for the bill
        string description;
        bool verified; // Is it vlayer verified or not
        Contributor[] contributors; // The pre-selected contributors. TODO: Maybe make this into a mapping of indexex usernames
    }

    mapping(bytes4 => Split) public splits; // Tracks all the split data
    mapping(address => bytes4[]) public userSplits; // Track all the splits for each requester

    // Declare price feed IDs for Pyth here
    bytes32 fxUsdEurFeed; // FX.EUR/USD
    bytes32 ethUsdFeed; // Crypto.ETH/USD
    bytes32 usdcUsdFeed; // Crypto.USDC/USD
    bytes32 btcUsdFeed; // Crypto.BTC/USD

    event SplitRequested(address indexed requester, bytes4 splitId);

    event SplitWithdrawn(
        address indexed requester,
        bytes4 indexed splitId,
        uint256 amount
    );

    event SplitContributed();

    /**
     * @param _pythAddress The address of the Pyth contract
     */
    // Pass the addresses for each pair but need to somehow identify each one, ig with a switch case?
    constructor(
        address _pythAddress,
        bytes32 _fxUsdEurFeed,
        bytes32 _ethUsdFeed,
        bytes32 _usdcUsdFeed,
        bytes32 _btcUsdFeed
    ) {
        pyth = IPyth(_pythAddress);
        fxUsdEurFeed = _fxUsdEurFeed;
        ethUsdFeed = _ethUsdFeed;
        usdcUsdFeed = _usdcUsdFeed;
        btcUsdFeed = _btcUsdFeed;
    }

    /// @notice Creates a new split request
    /// @dev Creates a splitId using the hashing function
    /// @param fiatAmount The amount of fiat spent on a bill
    /// @param tokenAddress The address of the wanted token
    /// @param currency The fiat currency that was used to pay the bill (FX ticket)
    /// @param contributors Each contributor (pass 0 for the contributed amount)
    function requestSplit(
        uint256 fiatAmount,
        address tokenAddress,
        string calldata currency,
        string calldata description,
        Contributor[] calldata contributors
    ) external {
        require(fiatAmount > 0, "Amount must be greater than 0");
        uint256 totalToContribute;
        for (uint256 i = 0; i < contributors.length; i++) {
            totalToContribute += contributors[i].toContribute;
        }
        require(
            totalToContribute >= (fiatAmount * 995) / 1000 &&
                totalToContribute <= (fiatAmount * 1005) / 1000,
            "Total to contribute doesn't add up to the fiat amount (0.5% tolerance)"
        );

        // Generate a unique split ID (includes timestamp to avoid collision)
        bytes32 splitId = keccak256(
            abi.encodePacked(
                msg.sender,
                tokenAddress,
                fiatAmount,
                currency,
                block.timestamp
            )
        );
        bytes4 shortId = bytes4(splitId); // takes the first 4 bytes (8 hex chars)

        Split storage newSplit = splits[shortId];
        newSplit.requesterAddress = msg.sender;
        newSplit.tokenAddress = tokenAddress;
        newSplit.fiatAmount = fiatAmount;
        newSplit.currency = currency;
        newSplit.description = description;
        newSplit.verified = false;

        for (uint256 i = 0; i < contributors.length; i++) {
            newSplit.contributors.push(contributors[i]);
        }

        userSplits[msg.sender].push(shortId);

        emit SplitRequested(msg.sender, shortId);
    }

    /// @notice Withdraws tokens from a split
    /// @dev Handles both ERC-20 and native token transfers
    /// @param splitId The ID of the split to withdraw from
    function splitWithdraw(
        bytes4 splitId,
        bytes[] calldata priceUpdate
    ) external {
        Split memory split = splits[splitId];

        require(
            msg.sender == split.requesterAddress,
            "Not the requester for this split"
        ); // Check that msg.sender is the actual requester of the splitId

        uint256 totalContributed; // The total amount that has been contributed so far
        uint256 totalWithdrawn;
        for (uint256 i = 0; i < split.contributors.length; i++) {
            totalContributed += split.contributors[i].contributed;
            totalWithdrawn += split.contributors[i].withdrawn;
            split.contributors[i].withdrawn = split.contributors[i].contributed;
        }
        uint256 canWithdraw = totalContributed - totalWithdrawn;

        if (split.tokenAddress == address(0)) {
            // If native token (ETH, MATIC, etc.)
            (bool sent, ) = msg.sender.call{value: canWithdraw}("");
            require(sent, "Native token withdrawal failed");
        } else {
            // ERC-20 token
            IERC20 token = IERC20(split.tokenAddress);
            require(
                token.transfer(msg.sender, canWithdraw),
                "ERC20 withdrawal failed"
            );
        }

        int64 price = getPrice(split.currency, split.tokenAddress, priceUpdate);
        require(price >= 0, "Negative price not allowed");
        uint256 withdrawValue = canWithdraw * uint256(int256(price));
        uint256 lowerBound = (split.fiatAmount * 995) / 1000; // 99.5% of fiatAmount
        uint256 upperBound = (split.fiatAmount * 1005) / 1000; // 100.5% of fiatAmount

        if (withdrawValue >= lowerBound && withdrawValue <= upperBound) {
            delete splits[splitId];

            // Remove splitId from userSplits[msg.sender] array
            bytes4[] storage splitsArray = userSplits[msg.sender];
            for (uint i = 0; i < splitsArray.length; i++) {
                if (splitsArray[i] == splitId) {
                    splitsArray[i] = splitsArray[splitsArray.length - 1]; // Replace with last element
                    splitsArray.pop(); // Remove last element
                    break;
                }
            }
        }

        emit SplitWithdrawn(msg.sender, splitId, canWithdraw);
    }

    /// @notice Allows the contributors to deposit funds to pay for the bill split
    /// @param splitId The split id
    /// @param username The name of the contributor
    /// @param amount The amount that the contributors are contributing in the requested token
    function contributeSplit(
        bytes4 splitId,
        string calldata username,
        uint256 amount
    ) external payable {
        require(amount > 0, "Amount must be greater than 0");

        Split storage split = splits[splitId];

        // Check and handle payment
        if (split.tokenAddress == address(0)) {
            // Native token (e.g., ETH)
            require(msg.value == amount, "Incorrect native token amount sent");
        } else {
            // ERC20 token
            require(msg.value == 0, "ETH sent with ERC20 contribution");
            bool success = IERC20(split.tokenAddress).transferFrom(
                msg.sender,
                address(this),
                amount
            );
            require(success, "ERC20 transfer failed");
        }

        // Loop through contributors to find the one with matching username
        bool found = false;
        for (uint256 i = 0; i < split.contributors.length; i++) {
            Contributor storage c = split.contributors[i];
            if (compareStrings(c.username, username)) {
                c.contributed += amount; // In the requested asset
                found = true;
                break;
            }
        }

        require(found, "Contributor not found");
    }

    /// @notice this function is used to get the price of an asset against any other currency
    function getPrice(
        string memory currencyTicket,
        address tokenAddress,
        bytes[] calldata priceUpdate
    ) private returns (int64) {
        string memory symbol;
        if (tokenAddress == address(0)) {
            symbol = "ETH"; // Only support ETH native assets for now
        } else {
            symbol = IERC20Metadata(tokenAddress).symbol();
        }

        uint fee = pyth.getUpdateFee(priceUpdate);
        pyth.updatePriceFeeds{value: fee}(priceUpdate);

        int64 fxPrice;
        int64 fxExp;
        if (compareStrings(currencyTicket, "EUR")) {
            // Get the price of the fiat in USD
            fxPrice = pyth.getPriceNoOlderThan(fxUsdEurFeed, 60).price;
            fxExp = pyth.getPriceNoOlderThan(fxUsdEurFeed, 60).expo;
        } else {
            fxPrice = 1;
        }

        bytes32 feedId;
        if (compareStrings(symbol, "ETH")) {
            // Get the price of the token in terms of the required fiat
            feedId = ethUsdFeed;
        } else if (
            compareStrings(symbol, "BTC") || compareStrings(symbol, "wBTC")
        ) {
            feedId = btcUsdFeed;
        } else if (compareStrings(symbol, "USDC")) {
            feedId = usdcUsdFeed;
        } else {
            revert("Unsupported token");
        }

        PythStructs.Price memory cryptoUsd = pyth.getPriceNoOlderThan(
            feedId,
            60
        );

        // 1. Need to get the price of the token in USD first
        // 2. Get the get the USD to the currency
        // 3. Divide one by the other to get the price of the token in the wanted token

        return ((cryptoUsd.price * (10 ^ cryptoUsd.expo)) /
            (fxPrice * (10 ^ fxExp)));
    }

    function compareStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // Helper for frontend to get all split IDs of a user, display it in a list
    function getUserSplits(
        address user
    ) external view returns (bytes4[] memory) {
        return userSplits[user];
    }

    // Optional: get full Split info from split ID
    function getSplit(bytes4 splitId) external view returns (Split memory) {
        return splits[splitId];
    }
}
