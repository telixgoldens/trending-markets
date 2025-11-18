// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMarket {
    function resolve(uint8 winningOutcome) external;
    function resolveTimestamp() external view returns (uint256);
}

contract OracleManager {
    struct Proposal {
        address market;
        uint8 proposedOutcome;
        uint256 proposedAt;
        uint256 disputeDeadline;
        bool finalized;
    }

    uint256 public disputeWindow; 
    address public owner;

    mapping(address => uint256) public latestProposalId;
    Proposal[] public proposals;

    event ProposalCreated(uint256 indexed id, address indexed market, uint8 outcome, uint256 proposedAt, uint256 disputeDeadline);
    event ProposalFinalized(uint256 indexed id, address indexed market, uint8 outcome);
    event ProposalChallenged(uint256 indexed id, address indexed challenger);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(uint256 _disputeWindow) {
        owner = msg.sender;
        disputeWindow = _disputeWindow;
    }

    function setDisputeWindow(uint256 _seconds) external onlyOwner {
        disputeWindow = _seconds;
    }

    function proposeAIResolution(address _market, uint8 _outcome) external onlyOwner returns (uint256) {
        require(_market != address(0), "Bad market");
        Proposal memory p = Proposal({
            market: _market,
            proposedOutcome: _outcome,
            proposedAt: block.timestamp,
            disputeDeadline: block.timestamp + disputeWindow,
            finalized: false
        });

        proposals.push(p);
        uint256 id = proposals.length - 1;
        latestProposalId[_market] = id;

        emit ProposalCreated(id, _market, _outcome, block.timestamp, block.timestamp + disputeWindow);
        return id;
    }

    function challengeProposal(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(!p.finalized, "Finalized");
        require(block.timestamp <= p.disputeDeadline, "Too late");
        p.finalized = true; 
        emit ProposalChallenged(_proposalId, msg.sender);
    }

    function finalizeProposal(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(!p.finalized, "Already finalized or challenged");
        require(block.timestamp > p.disputeDeadline, "Dispute window open");
        p.finalized = true;

        IMarket(p.market).resolve(p.proposedOutcome);

        emit ProposalFinalized(_proposalId, p.market, p.proposedOutcome);
    }
}
