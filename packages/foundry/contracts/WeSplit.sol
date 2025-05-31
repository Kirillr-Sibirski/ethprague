//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "forge-std/console.sol"; // Useful for debugging. Remove when deploying to a live network.
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract WeSplit {
    struct Split {
        address requesterAddress; // The requester address aka the person who has paid in fiat
        address tokenAddress; // The address of the token that they want to receive
        uint256 fiatAmount; // The amount of fiat they have spent
        string currency; // The fiat currency used to pay for the bill
    }

    mapping(bytes3 => Split) public splits; // Tracks all the split data
    mapping(address => bytes32[]) public userSplits; // Track all the splits for each user

    event SplitRequested(
        address indexed requester,
        bytes3 indexed splitId,
        address tokenAddress,
        uint256 fiatAmount,
        string currency
    );

    function requestSplit(
        uint256 fiatAmount,
        address tokenAddress,
        string calldata currency
    ) external {
        require(fiatAmount > 0, "Amount must be greater than 0");
        require(tokenAddress != address(0), "Invalid token address");

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
            currency: currency
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

    // Helper for frontend to get all split IDs of a user, display it in a list
    function getUserSplits(
        address user
    ) external view returns (bytes32[] memory) {
        return userSplits[user];
    }

    // Optional: get full Split info from split ID
    function getSplit(bytes3 splitId) external view returns (Split memory) {
        return splits[splitId];
    }
}
