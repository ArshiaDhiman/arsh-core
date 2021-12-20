const ARSHToken = artifacts.require("ARSHToken");
const Faucet = artifacts.require("Faucet");
const Staking = artifacts.require("Staking");

module.exports = async function (deployer) {
  await deployer.deploy(ARSHToken, "1000000000000000000000000000");

  const token = await ARSHToken.deployed();

  await deployer.deploy(
    Faucet,
    token.address,
    "3600",
    "10000000000000000000000"
  );

  await deployer.deploy(Staking, token.address);
};

// 0xe4aa457d296b896451617f6c83468f3691e0aba4
