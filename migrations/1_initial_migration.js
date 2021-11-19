const ARSHToken = artifacts.require("ARSHToken");
const Faucet = artifacts.require("Faucet");

module.exports = async function (deployer) {
  await deployer.deploy(ARSHToken, "1000000000000000000000000000");

  const token = await ARSHToken.deployed();

  await deployer.deploy(Faucet, token.address, "3600", "1000000000");
};
