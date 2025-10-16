// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OutcomeToken.sol";

contract BinaryMarket is Ownable {
    OutcomeToken public tokenYes;
    OutcomeToken public tokenNo;
    IERC20 public collateral;

    uint256 public feeBps; 
    bool public resolved;
    uint8 public winningOutcome;

    uint256 public reserveYes;
    uint256 public reserveNo;

    uint256 public totalLpShares;
    mapping(address => uint256) public lpShares;

    string public question;
    uint256 public resolveTimestamp;
    address public oracle;

    
    event LiquidityAdded(address indexed provider, uint256 yesAmount, uint256 noAmount, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 collateralOut, uint256 shares);
    event Swap(address indexed trader, uint8 outcomeIndex, uint256 collateralIn, uint256 tokensOut, uint256 fee);
    event MarketResolved(uint8 winningOutcome);
    event Redeemed(address indexed redeemer, uint256 tokensRedeemed, uint256 payout);

    modifier whenNotResolved() {
        require(!resolved, "Market already resolved");
        _;
    }

    modifier onlyOracleOrOwner() {
        require(msg.sender == oracle || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(
        address _collateral,
        string memory _question,
        uint256 _resolveTimestamp,
        address _oracle,
        uint256 _feeBps,
        address creator,
        string memory yesName,
        string memory yesSymbol,
        string memory noName,
        string memory noSymbol
    ) Ownable(creator) {
        collateral = IERC20(_collateral);
        question = _question;
        resolveTimestamp = _resolveTimestamp;
        oracle = _oracle;
        feeBps = _feeBps;

        // Deploy YES / NO tokens
        tokenYes = new OutcomeToken(yesName, yesSymbol, address(this));
        tokenNo = new OutcomeToken(noName, noSymbol, address(this));

        tokenYes.transferOwnership(address(this));
        tokenNo.transferOwnership(address(this));

        
    }

    function addLiquidity(uint256 yesCollateral, uint256 noCollateral) external whenNotResolved {
        require(yesCollateral > 0 || noCollateral > 0, "Zero deposit");

        if (yesCollateral > 0) {
            require(collateral.transferFrom(msg.sender, address(this), yesCollateral), "Transfer failed");
            reserveYes += yesCollateral;
            tokenYes.mint(msg.sender, yesCollateral);
        }
        if (noCollateral > 0) {
            require(collateral.transferFrom(msg.sender, address(this), noCollateral), "Transfer failed");
            reserveNo += noCollateral;
            tokenNo.mint(msg.sender, noCollateral);
        }

        uint256 shares = yesCollateral + noCollateral;
        if (shares > 0) {
            lpShares[msg.sender] += shares;
            totalLpShares += shares;
            emit LiquidityAdded(msg.sender, yesCollateral, noCollateral, shares);
        }
    }

    function removeLiquidity(uint256 shares) external {
        require(shares > 0 && lpShares[msg.sender] >= shares, "Invalid shares");
        require(totalLpShares > 0, "No LP");

        uint256 collateralYesOut = (reserveYes * shares) / totalLpShares;
        uint256 collateralNoOut = (reserveNo * shares) / totalLpShares;
        uint256 totalOut = collateralYesOut + collateralNoOut;

        reserveYes -= collateralYesOut;
        reserveNo -= collateralNoOut;
        lpShares[msg.sender] -= shares;
        totalLpShares -= shares;

        require(collateral.transfer(msg.sender, totalOut), "Transfer failed");
        emit LiquidityRemoved(msg.sender, totalOut, shares);
    }

    function buy(uint8 outcomeIndex, uint256 collateralIn, uint256 minTokensOut) external whenNotResolved {
        require(outcomeIndex == 0 || outcomeIndex == 1, "Bad outcome");
        require(collateralIn > 0, "Zero collateral");

        uint256 fee = (collateralIn * feeBps) / 10000;
        uint256 net = collateralIn - fee;

        uint256 tokensOut;
        if (outcomeIndex == 1) {
            require(reserveNo > 0, "Insufficient depth");
            tokensOut = (net * reserveNo) / (reserveYes + net);
            reserveYes += net;
        } else {
            require(reserveYes > 0, "Insufficient depth");
            tokensOut = (net * reserveYes) / (reserveNo + net);
            reserveNo += net;
        }

        require(tokensOut > 0 && tokensOut >= minTokensOut, "Slippage");
        require(collateral.transferFrom(msg.sender, address(this), collateralIn), "Transfer failed");

        if (outcomeIndex == 1) {
            tokenYes.mint(msg.sender, tokensOut);
        } else {
            tokenNo.mint(msg.sender, tokensOut);
        }

        emit Swap(msg.sender, outcomeIndex, collateralIn, tokensOut, fee);
    }

    function sell(uint8 outcomeIndex, uint256 tokensIn, uint256 minCollateralOut) external whenNotResolved {
        require(outcomeIndex == 0 || outcomeIndex == 1, "Bad outcome");
        require(tokensIn > 0, "Zero tokens");

        uint256 collateralOut;
        if (outcomeIndex == 1) {
            require(reserveYes + tokensIn > 0, "Invalid math");
            collateralOut = (tokensIn * reserveNo) / (reserveYes + tokensIn);
            tokenYes.burn(msg.sender, tokensIn);
            reserveNo -= collateralOut;
        } else {
            collateralOut = (tokensIn * reserveYes) / (reserveNo + tokensIn);
            tokenNo.burn(msg.sender, tokensIn);
            reserveYes -= collateralOut;
        }

        require(collateralOut >= minCollateralOut, "Slippage");
        require(collateral.transfer(msg.sender, collateralOut), "Transfer failed");
        emit Swap(msg.sender, outcomeIndex, collateralOut, tokensIn, 0);
    }

    function resolve(uint8 _winningOutcome) external onlyOracleOrOwner {
        require(!resolved, "Already resolved");
        require(_winningOutcome == 0 || _winningOutcome == 1, "Bad outcome");
        require(block.timestamp >= resolveTimestamp, "Too early");
        resolved = true;
        winningOutcome = _winningOutcome;
        emit MarketResolved(winningOutcome);
    }

    function redeem(uint256 tokensToRedeem) external {
        require(resolved, "Not resolved");
        require(tokensToRedeem > 0, "Zero");

        uint256 payout;
        if (winningOutcome == 1) {
            tokenYes.burn(msg.sender, tokensToRedeem);
            payout = tokensToRedeem;
            require(reserveYes >= payout, "Insufficient reserve");
            reserveYes -= payout;
        } else {
            tokenNo.burn(msg.sender, tokensToRedeem);
            payout = tokensToRedeem;
            require(reserveNo >= payout, "Insufficient reserve");
            reserveNo -= payout;
        }

        require(collateral.transfer(msg.sender, payout), "Transfer failed");
        emit Redeemed(msg.sender, tokensToRedeem, payout);
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high");
        feeBps = _feeBps;
    }

    function getReserves() external view returns (uint256 yesReserve, uint256 noReserve) {
        return (reserveYes, reserveNo);
    }
}
