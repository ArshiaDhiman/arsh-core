pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Faucet is Ownable {
    IERC20 public token;
    uint256 public waitTime;
    uint256 public tokenAmount;
    mapping(address => uint256) public lastAccessTime;

    constructor(
        address _token,
        uint256 _waitTime,
        uint256 _tokenAmount
    ) {
        token = IERC20(_token);
        waitTime = _waitTime; // seconds
        tokenAmount = _tokenAmount;
    }

    modifier allowedToWithdraw(address _address) {
        require(
            block.timestamp > lastAccessTime[_address] + waitTime,
            "user must wait"
        );
        _;
    }

    function requestTokens() public allowedToWithdraw(msg.sender) {
        lastAccessTime[msg.sender] = block.timestamp;
        token.transfer(msg.sender, tokenAmount);
    }

    function setToken(address _token) external onlyOwner returns (bool) {
        token = IERC20(_token);
        return true;
    }

    function setWaitTime(uint256 _waitTime) external onlyOwner returns (bool) {
        waitTime = _waitTime;
        return true;
    }

    function setTokenAmount(uint256 _tokenAmount)
        external
        onlyOwner
        returns (bool)
    {
        tokenAmount = _tokenAmount;
        return true;
    }

    function transferTokens() external onlyOwner {
        token.transfer(owner(), token.balanceOf(address(this)));
    }
}
