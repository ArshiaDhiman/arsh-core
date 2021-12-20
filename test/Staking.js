const { expectRevert, time } = require("@openzeppelin/test-helpers");
const { assert } = require("chai");
const year = 31536000;
const halfYear = 15768000;
const quarterYear = 7884000;
/* 
  Staking pool
    an array of StakingPool structs
    Contains the current staking pools
    Struct should have lock period, total staked, mapping of      stakers (amount/deposit time)

  Staker
      struct for user in staking pools
      should have amount staked and last time staked

  addPool -
      should add a new staking pool

  getPoolsLength -
    should get the length of the pools array

 stake - 
    a user should be able to stake tokens in a pool
    a user should not be able to stake 0 
    a user should be able to stake multiple times
    a use should not be able to stake in a pool that doesnt exist


  unstake - 
    a user should be able to unstake their tokens
    a user should get a reward for staking their tokens based on the time passed
    a user should not be able to unstake their tokens if the lock period has not passed
    a user shouldnt be able to unstake from a pool they are not staking in

  reward -
    a user should recieve an award based on their staking time
    

  set pool
  compound reward for second stake
*/

const ARSHToken = artifacts.require("ARSHToken");
const Staking = artifacts.require("Staking");

contract("Staking", (accounts) => {
  before(async () => {
    this.staking = await Staking.deployed();
    this.token = await ARSHToken.deployed();
    await this.token.transfer(this.staking.address, "1000000000000");
    await this.token.transfer(accounts[1], "10000000");
    await this.token.transfer(accounts[2], "10000000");
    await this.token.transfer(accounts[3], "10000000");
    await this.token.approve(
      this.staking.address,
      "1000000000000000000000000000000000000000000"
    );
    await this.token.approve(
      this.staking.address,
      "1000000000000000000000000000000000000000000",
      { from: accounts[1] }
    );
    await this.token.approve(
      this.staking.address,
      "1000000000000000000000000000000000000000000",
      { from: accounts[2] }
    );
    await this.token.approve(
      this.staking.address,
      "1000000000000000000000000000000000000000000",
      { from: accounts[3] }
    );
  });

  describe("addPool", async () => {
    it("should add a pool", async () => {
      const lengthBefore = await this.staking.getPoolsLength();

      await this.staking.addPool("pool 1", 31536000, 40);

      await this.staking.addPool("pool 2", 15768000, 30);

      const lengthAfter = await this.staking.getPoolsLength();

      assert.equal(lengthAfter.sub(lengthBefore), 2);
    });

    it("should update pool after pool has been made ", async () => {
      await this.staking.setPools(0, "pool 1.1", 30, 31536000);

      const pools = await this.staking.getPools();

      const [{ rewardRate, lockPeriod }] = pools;

      assert.equal(rewardRate, 30);
      assert.equal(lockPeriod, 31536000);
    });
  });

  describe("stake", async () => {
    it("should allow a user to stake tokens in a pool", async () => {
      const bal_before = await this.staking.getPoolTotalStaked(0);

      await this.staking.stake(1000, 0);

      const bal_after = await this.staking.getPoolTotalStaked(0);

      assert.equal(bal_after.sub(bal_before), 1000);
    });

    it("user should not be able to stake 0", async () => {
      await expectRevert(this.staking.stake(0, 0), "user cant stake 0");
    });

    it("user should be able to stake multiple times", async () => {
      const bal_before = await this.staking.getPoolTotalStaked(0);

      await this.staking.stake(1000, 0);

      await this.staking.stake(1000, 0);

      const bal_after = await this.staking.getPoolTotalStaked(0);

      assert.equal(bal_after.sub(bal_before), 2000);
    });

    it("user should not be able to stake in a pool that dosnt exist", async () => {
      await expectRevert(
        this.staking.stake(100, 5),
        "user must stake in a current pool"
      );
    });
  });

  describe("unstake", async () => {
    it("user should be able to unstake tokens in a pool and recieve reward", async () => {
      // const now = Math.round(new Date().getTime() / 1000);
      await this.staking.stake(1000, 0, { from: accounts[1] });

      const balBefore = await this.token.balanceOf(accounts[1]);

      await time.increase(year);

      await this.staking.unstake(0, { from: accounts[1] });

      const balAfter = await this.token.balanceOf(accounts[1]);

      assert.equal(balAfter.sub(balBefore).toString(), 1300);
    });

    it("should compound reward for second stake", async () => {
      const balBefore = await this.token.balanceOf(accounts[2]);

      await this.staking.stake(1000, 0, { from: accounts[2] });

      await time.increase(halfYear); // 150

      await this.staking.stake(1000, 0, { from: accounts[2] }); // 1150 + 1000

      await time.increase(year);

      await this.staking.unstake(0, { from: accounts[2] });

      const balAfter = await this.token.balanceOf(accounts[2]);

      assert.equal(balAfter.sub(balBefore).toString(), 795);
    });

    it("should update totalStaked when someone unstake", async () => {
      await this.staking.stake(1000, 0, { from: accounts[2] });

      const balBefore = await this.staking.getPoolTotalStaked(0);

      await time.increase(year);

      await this.staking.unstake(0, { from: accounts[2] });

      const balAfter = await this.staking.getPoolTotalStaked(0);

      assert.equal(balBefore.sub(balAfter).toString(), 1300);
    });

    it("a user should not be able to unstake tokens till lockperiod is over", async () => {
      await this.staking.stake(1000, 0, { from: accounts[3] });

      // const balBefore = await this.token.balanceOf(accounts[3]);

      // await time.increase(quarterYear);

      await expectRevert(
        this.staking.unstake(0, { from: accounts[3] }),
        "user must wait till lock period is done"
      );

      // const balAfter = await this.token.balanceOf(accounts[3]);

      // assert.equal(balAfter, balBefore);
    });
  });
});
