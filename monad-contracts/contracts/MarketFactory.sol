// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BinaryMarket.sol";

contract MarketFactory is Ownable {
    address public collateral;
    uint256 public defaultFeeBps;
    address[] public markets;

    
    event MarketCreated(
        address indexed market,
        address indexed creator,
        string question,
        uint256 resolveTimestamp
    );

    constructor(address _owner, address _collateral) Ownable(_owner) {
        collateral = _collateral;
        defaultFeeBps = 50; // default 0.5% fee
    }

    function createMarket(
        string memory _question,
        uint256 _resolveTimestamp,
        string memory yesName,
        string memory yesSymbol,
        string memory noName,
        string memory noSymbol
    ) external returns (address) {
        BinaryMarket market = new BinaryMarket(
            collateral,
            _question,
            _resolveTimestamp,
            msg.sender,       // oracle
            defaultFeeBps,
            msg.sender,       // owner
            yesName,
            yesSymbol,
            noName,
            noSymbol
        );

        markets.push(address(market));

        
        emit MarketCreated(address(market), msg.sender, _question, _resolveTimestamp);

        return address(market);
    }

    function setDefaultFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // max 10%
        defaultFeeBps = _feeBps;
    }

    function getMarkets() external view returns (address[] memory) {
        return markets;
    }
}
