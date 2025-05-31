//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "forge-std/console.sol"; // Useful for debugging. Remove when deploying to a live network.
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract WeSplit {
    struct Contributor {
        string username;
        uint256 contributed; // Amount of assets contributed so far in the requested token
        uint256 toContribute; // The fiat value that must be fulfilled (total to contribute)
    }
    struct Split {
        address requesterAddress; // The requester address aka the person who has paid in fiat
        address tokenAddress; // The address of the token that they want to receive
        uint256 fiatAmount; // The amount of fiat they have spent (probably don't even need this since we store the toContribute in each Contributor)
        string currency; // The fiat currency used to pay for the bill
        bool verified;
        Contributor[] contributors;
    }

    mapping(bytes3 => Split) public splits; // Tracks all the split data
    mapping(address => bytes3[]) public userSplits; // Track all the splits for each requester

    event SplitRequested(
        address indexed requester,
        bytes3 indexed splitId,
        address tokenAddress,
        uint256 fiatAmount,
        string currency
    );

    event SplitWithdrawn(
        address indexed requester,
        bytes3 indexed splitId,
        uint256 amount
    );

    /// @notice Creates a new split request
    /// @dev Creates a splitId using the hashing function
    /// @param fiatAmount The amount of fiat spent on a bill
    /// @param tokenAddress The address of the wanted token
    /// @param currency The fiat currency that was used to pay the bill
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
        bytes3 shortId = bytes3(splitId); // takes the first 3 bytes (6 hex chars)

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
    function splitWithdraw(bytes3 splitId, uint256 withdrawAmount) public {
        // TODO: Add the proper state handling, add requires to prevent them from withdrawing more than they actually have
        Split memory split = splits[splitId];

        require(
            msg.sender == split.requesterAddress,
            "Not the requester for this split"
        ); // Check that msg.sender is the owner

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

    // Helper for frontend to get all split IDs of a user, display it in a list
    function getUserSplits(
        address user
    ) external view returns (bytes3[] memory) {
        return userSplits[user];
    }

    // Optional: get full Split info from split ID
    function getSplit(bytes3 splitId) external view returns (Split memory) {
        return splits[splitId];
    }
}