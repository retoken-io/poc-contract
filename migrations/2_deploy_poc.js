var PoCToken = artifacts.require("./PoCToken.sol");

module.exports = function(deployer) {
  deployer.deploy(PoCToken, "1000000000000000000", "1000000000000", "0x0");
};
