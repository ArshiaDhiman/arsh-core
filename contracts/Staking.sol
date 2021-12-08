// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Staking is Ownable {
    using SafeMath for uint256;

    struct Stakeholder {
        uint256 amount;
        uint256 depositTime;
        bool active;
    }

    struct StakingPoolView {
        uint256 rewardRate;
        uint256 lockPeriod;
        uint256 totalStaked;
    }

    struct StakingPool {
        uint256 rewardRate;
        uint256 lockPeriod;
        uint256 totalStaked;
        mapping(address => Stakeholder) stakeholders;
    }

    uint256 public rewardInterval = 31536000; // year

    StakingPool[] public stakingPools;

    IERC20 public token;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function getPools() external view returns (StakingPoolView[] memory pools) {
        uint256 len = getPoolsLength();
        pools = new StakingPoolView[](len);

        for (uint256 i = 0; i < len; i++) {
            StakingPool storage p = stakingPools[i];
            pools[i] = StakingPoolView(
                p.rewardRate,
                p.lockPeriod,
                p.totalStaked
            );
        }
    }

    function setPools(
        uint256 _index,
        uint256 _rewardRate,
        uint256 _lockPeriod
    ) external onlyOwner {
        stakingPools[_index].rewardRate = _rewardRate;
        stakingPools[_index].lockPeriod = _lockPeriod;
    }

    function addPool(uint256 _lockPeriod, uint256 _rewardRate)
        external
        onlyOwner
    {
        uint256 idx = stakingPools.length;
        stakingPools.push();
        stakingPools[idx].lockPeriod = _lockPeriod;
        stakingPools[idx].rewardRate = _rewardRate;
    }

    function getPoolsLength() public view returns (uint256) {
        return stakingPools.length;
    }

    function getPoolTotalStaked(uint256 _index) public view returns (uint256) {
        return stakingPools[_index].totalStaked;
    }

    function addStakeholder(uint256 _index) public {
        StakingPool storage pool = stakingPools[_index];
        pool.stakeholders[msg.sender].active = true;
    }

    function stake(uint256 _amount, uint256 _index) external {
        require(_amount > 0, "user cant stake 0");
        require(
            _index < stakingPools.length,
            "user must stake in a current pool"
        );

        StakingPool storage pool = stakingPools[_index];
        Stakeholder storage user = pool.stakeholders[msg.sender];

        if (!user.active) {
            addStakeholder(_index);
        } else {
            // compounding
            user.amount = user.amount.add(calculateReward(_index, msg.sender));
        }

        user.amount = user.amount.add(_amount);
        user.depositTime = block.timestamp;

        pool.totalStaked = pool.totalStaked.add(_amount);

        token.transferFrom(msg.sender, address(this), _amount);
    }

    function unstake(uint256 _index) external {
        uint256 amount = stakingPools[_index].stakeholders[msg.sender].amount;

        uint256 reward = calculateReward(_index, msg.sender);

        removeStakeholder(_index, msg.sender);

        uint256 totalTransfer = amount.add(reward);

        token.transfer(msg.sender, totalTransfer);
    }

    function removeStakeholder(uint256 _index, address _address) public {
        stakingPools[_index].stakeholders[_address].active = false;
        stakingPools[_index].stakeholders[_address].amount = 0;
        stakingPools[_index].stakeholders[_address].depositTime = 0;
    }

    function getAmountStaked(uint256 _index, address _staker)
        public
        view
        returns (uint256)
    {
        return stakingPools[_index].stakeholders[_staker].amount;
    }

    function calculateReward(uint256 _index, address _address)
        public
        view
        returns (uint256)
    {
        StakingPool storage pool = stakingPools[_index];
        Stakeholder storage user = pool.stakeholders[_address];

        uint256 depositTime = user.depositTime;
        uint256 lockPeriod = pool.lockPeriod;
        uint256 rewardRate = pool.rewardRate;
        uint256 timeStaked = block.timestamp.sub(depositTime);
        uint256 amount = getAmountStaked(_index, _address);

        uint256 rewardTime = timeStaked > lockPeriod ? lockPeriod : timeStaked;

        uint256 reward = amount
            .mul(rewardRate)
            .mul(rewardTime)
            .div(rewardInterval)
            .div(100); // percent
        return reward;
    }
}
