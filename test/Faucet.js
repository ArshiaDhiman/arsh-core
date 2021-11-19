const Faucet = artifacts.require("Faucet");
const ARSHToken = artifacts.require("ARSHToken");
const { expectRevert } = require("@openzeppelin/test-helpers");
const transferAmount = "1000000000";
const moneyForFaucet = "100000000000000000000000";

contract("Faucet", (accounts) => {
  before(async () => {
    this.faucet = await Faucet.deployed();
    this.token = await ARSHToken.deployed();
  });

  describe("setup", () => {
    it("Should send ARSHToken to faucet", async () => {
      await this.token.transfer(this.faucet.address, moneyForFaucet);

      assert.equal(
        await this.token.balanceOf(this.faucet.address),
        moneyForFaucet
      );
    });
  });

  describe("requestTokens", () => {
    it("should transfer tokens to the caller", async () => {
      const initialBalance = await this.token.balanceOf(accounts[1]);

      await this.faucet.requestTokens({ from: accounts[1] });

      const balanceAfter = await this.token.balanceOf(accounts[1]);

      const amountRecieved = balanceAfter.sub(initialBalance);

      await expectRevert(
        this.faucet.requestTokens({ from: accounts[1] }),
        "user must wait"
      );

      assert.equal(amountRecieved, transferAmount);
    });

    it("Should throw error if not allowed to withdraw", async () => {
      await expectRevert(
        this.faucet.requestTokens({ from: accounts[1] }),
        "user must wait"
      );
    });
  });

  describe("setToken", () => {
    it("allow to set token - only owner", async () => {
      await this.faucet.setToken(this.token.address, { from: accounts[0] });

      const newTokenAddress = await this.faucet.token();

      assert.equal(newTokenAddress, this.token.address);

      await this.faucet.setToken(this.token.address);
    });
  });

  describe("setWaitTime", async () => {
    it("allow to set waittime - only owner", async () => {
      await this.faucet.setWaitTime("3600");

      const newTokenAddress = await this.faucet.waitTime();

      assert.equal(newTokenAddress, "3600");
    });
  });

  describe("setTokenAmount", async () => {
    it("allow to set TokenAmount - only owner", async () => {
      await this.faucet.setTokenAmount("1000000000000");

      const newTokenAmount = await this.faucet.tokenAmount();

      assert.equal(newTokenAmount, "1000000000000");
    });
  });

  describe("transferTokens", async () => {
    it("transfers token to owner", async () => {
      const initialBalance2 = await this.token.balanceOf(accounts[0]);

      const faucetAmount = await this.token.balanceOf(this.faucet.address);

      await this.faucet.transferTokens({ from: accounts[0] });

      const finalBalance2 = await this.token.balanceOf(accounts[0]);

      const transferAmount = finalBalance2.sub(initialBalance2);

      assert.equal(transferAmount.toString(), faucetAmount.toString());
    });
  });
});
