// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MinimalForwarder {
    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
    }

    mapping(address => uint256) public nonces;

    event MetaTxExecuted(address indexed from, address indexed to, bytes data, uint256 value);

    function getMessageHash(ForwardRequest memory req) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(req.from, req.to, req.value, req.gas, req.nonce, keccak256(req.data)));
    }

    function execute(ForwardRequest calldata req, bytes calldata signature) external payable returns (bool, bytes memory) {
        bytes32 hashed = getMessageHash(req);
        bytes32 ethSigned = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hashed));
        address signer = recoverSigner(ethSigned, signature);
        require(signer == req.from, "Invalid signature");
        require(nonces[req.from]++ == req.nonce, "Bad nonce");

        (bool ok, bytes memory ret) = req.to.call{value: req.value, gas: req.gas}(req.data);
        emit MetaTxExecuted(req.from, req.to, req.data, req.value);
        return (ok, ret);
    }

    function recoverSigner(bytes32 _hash, bytes memory _sig) internal pure returns (address) {
        if (_sig.length != 65) return address(0);
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(_sig, 32))
            s := mload(add(_sig, 64))
            v := byte(0, mload(add(_sig, 96)))
        }
        return ecrecover(_hash, v, r, s);
    }
}
