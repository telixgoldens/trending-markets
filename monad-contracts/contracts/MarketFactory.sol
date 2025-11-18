// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "./BinaryMarket.sol";

contract MarketFactory is Ownable, ERC2771Context {
    address public collateral;
    uint256 public defaultFeeBps;
    address[] public markets;
    address public oracleManager;

    event OracleManagerSet(address indexed oracleManager);
    event MarketCreated(
        address indexed market,
        address indexed creator,
        string question,
        uint256 resolveTimestamp
    );

    constructor(address _owner, address _collateral, address _trustedForwarder)
        Ownable(_owner)
        ERC2771Context(_trustedForwarder)
    {
        collateral = _collateral;
        defaultFeeBps = 50;
    }
    
    function trustedForwarder() public view override returns (address) {
        return ERC2771Context.trustedForwarder();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function setOracleManager(address _oracleManager) external onlyOwner {
        oracleManager = _oracleManager;
        emit OracleManagerSet(_oracleManager);
    }

    function createMarket(
        string memory _question,
        uint256 _resolveTimestamp,
        string memory yesName,
        string memory yesSymbol,
        string memory noName,
        string memory noSymbol
    ) external returns (address) {
        address creator = _msgSender();

        BinaryMarket market = new BinaryMarket(
            collateral,
            _question,
            _resolveTimestamp,
            oracleManager,         
            defaultFeeBps,
            creator,              
            yesName,
            yesSymbol,
            noName,
            noSymbol,
            trustedForwarder()    
        );

        markets.push(address(market));
        emit MarketCreated(address(market), creator, _question, _resolveTimestamp);

        return address(market);
    }

    function setDefaultFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high");
        defaultFeeBps = _feeBps;
    }

    function getMarkets() external view returns (address[] memory) {
        return markets;
    }

}
