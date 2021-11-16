const ARSHToken = artifacts.require("ARSHToken");

module.exports = function (deployer) {
  deployer.deploy(ARSHToken, "1000000000000000000000000000");
};
