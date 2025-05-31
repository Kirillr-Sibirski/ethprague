//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "forge-std/console.sol"; // Useful for debugging. Remove when deploying to a live network.
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract WeSplit {
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
        bool verified; // Is it vlayer verified or not
        Contributor[] contributors; // The pre-selected contributors. TODO: Maybe make this into a mapping of indexex usernames
    }

    mapping(bytes4 => Split) public splits; // Tracks all the split data
    mapping(address => bytes4[]) public userSplits; // Track all the splits for each requester

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
    function splitWithdraw(bytes4 splitId, uint256 withdrawAmount) external {
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
        // Calculate the price of the withdraw amount in the fiat currency
        // Compare it to the fiatAmount, if it's the same then we remove the split entirely

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
            if (
                keccak256(abi.encodePacked(c.username)) ==
                keccak256(abi.encodePacked(username)) // cuz can't compare strings directly in solidity
            ) {
                c.contributed += amount;
                found = true;
                break;
            }
        }

        require(found, "Contributor not found");
    }

    function getPrice(
        string memory currencyTicket,
        address tokenAddress
    ) private returns (uint256) {
        // Here goes the Pyth implementation that returns the price of the asset
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
