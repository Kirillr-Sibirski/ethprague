// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/WeSplit.sol";

contract WeSplitTest is Test {
    WeSplit public WeSplit;

    function setUp() public {
        WeSplit = new WeSplit(vm.addr(1));
    }

    function testMessageOnDeployment() public view {
        require(keccak256(bytes(WeSplit.greeting())) == keccak256("Building Unstoppable Apps!!!"));
    }
}
