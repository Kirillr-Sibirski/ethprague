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

    event SplitRequested(
        address indexed requester,
        bytes4 indexed splitId,
        address tokenAddress,
        uint256 fiatAmount,
        string currency
    );

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
        // require(tokenAddress != address(0), "Invalid token address");

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
        bytes4 shortId = bytes4(splitId); // takes the first 3 bytes (6 hex chars)

        // Store the split info
        splits[shortId] = Split({
            requesterAddress: msg.sender,
            tokenAddress: tokenAddress,
            fiatAmount: fiatAmount,
            currency: currency,
            description: description,
            verified: false, //TODO: Fix this once vlayer is implemented
            contributors: contributors
        });

        userSplits[msg.sender].push(shortId);

        emit SplitRequested(
            msg.sender,
            shortId,
            tokenAddress,
            fiatAmount,
            currency
        );
    }

    /// @notice Withdraws tokens from a split
    /// @dev Handles both ERC-20 and native token transfers
    /// @param splitId The ID of the split to withdraw from
    /// @param withdrawAmount The amount of tokens to withdraw (in wei or token decimals)
    function splitWithdraw(
        bytes4 splitId,
        uint256 withdrawAmount,
        bytes[] calldata priceUpdate
    ) external {
        // TODO: Add the proper state handling, add requires to prevent them from withdrawing more than they actually have
        Split memory split = splits[splitId];

        require(
            msg.sender == split.requesterAddress,
            "Not the requester for this split"
        ); // Check that msg.sender is the actual requester of the splitId

        uint256 totalContributed; // The total amount that has been contributed so far
        for (uint256 i = 0; i < split.contributors.length; i++) {
            totalContributed += split.contributors[i].contributed;
        }

        require(
            totalContributed <= withdrawAmount,
            "Withdrawing more tokens than has been contributed so far"
        );

        if (split.tokenAddress == address(0)) {
            // If native token (ETH, MATIC, etc.)
            (bool sent, ) = msg.sender.call{value: withdrawAmount}("");
            require(sent, "Native token withdrawal failed");
        } else {
            // ERC-20 token
            IERC20 token = IERC20(split.tokenAddress);
            require(
                token.transfer(msg.sender, withdrawAmount),
                "ERC20 withdrawal failed"
            );
        }

        PythStructs.Price memory price = getPrice(
            split.currency,
            split.tokenAddress,
            priceUpdate
        );
        require(price.price >= 0, "Negative price not allowed");
        require(price.expo >= 0, "Negative exponent not allowed");
        uint256 withdrawValue = withdrawAmount *
            uint256(int256(price.price * price.expo));
        uint256 lowerBound = (split.fiatAmount * 995) / 1000; // 99.5% of fiatAmount
        uint256 upperBound = (split.fiatAmount * 1005) / 1000; // 100.5% of fiatAmount

        if (withdrawValue >= lowerBound && withdrawValue <= upperBound) {
            // TODO: pop the split from the mappings
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

        emit SplitWithdrawn(msg.sender, splitId, withdrawAmount);
    }

    /// @notice Allows the contributors to deposit funds to pay for the bill split
    /// @param splitId The split id
    /// @param username The name of the contributor
    /// @param amount The amount that the contributors are contributing in the requested token
    function contributeSplit(
        bytes4 splitId,
        string calldata username,
        uint256 amount
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        Split storage split = splits[splitId];

        // Loop through contributors to find the one with matching username
        bool found = false;
        for (uint256 i = 0; i < split.contributors.length; i++) {
            Contributor storage c = split.contributors[i];
            if (compareStrings(c.username, username)) {
                c.contributed += amount;
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
    ) private returns (PythStructs.Price memory) {
        string memory symbol;
        if (tokenAddress == address(0)) {
            symbol = "ETH"; // Only support ETH native assets for now
        } else {
            symbol = IERC20Metadata(tokenAddress).symbol();
        }

        // TODO: Add a function here to check the currency of it. Assigns the price CURRENCY TO USD
        int64 fxPrice;
        if (compareStrings(currencyTicket, "EUR")) {
            // Get FX price from Pyth here
        } else {
            fxPrice = 0;
        }

        bytes32 feedId;
        if (compareStrings(symbol, "ETH")) {
            feedId = ethUsdFeed;
        } else if (compareStrings(symbol, "BTC")) {
            feedId = btcUsdFeed;
        } else if (compareStrings(symbol, "USDC")) {
            feedId = usdcUsdFeed;
        } else {
            revert("Unsupported token");
        }

        // 1. Need to get the price of the token in USD first
        // 2. Get the get the USD to the currency
        // 3. Divide one by the other to get the price of the token in the wanted token

        uint fee = pyth.getUpdateFee(priceUpdate);
        pyth.updatePriceFeeds{value: fee}(priceUpdate);

        return pyth.getPriceNoOlderThan("0x", 60); // priceFeedId
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
